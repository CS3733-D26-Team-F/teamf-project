import { Router } from 'express';
import {prisma} from '../setup/prisma.js';
import {supabase} from '../setup/supabase.js';
import {upload} from '../setup/upload.js';
import {checkJWT, management, getManagementToken} from '../setup/auth0.js';

const router = Router();

// Return the currently logged-in employee record using the Auth0 subject ID.
router.get('/api/auth/me', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const employee = await prisma.employee.findUnique({where: {auth0Id}});
    if (!employee) return res.status(404).json({error: 'Employee not found'});

    res.json({employee});
});

// Fetch every employee record for admin-style views and dropdowns.
router.get('/employees', async (req, res) => {
    //const auth0Id = req.auth!.payload.sub as string;
    const employees = await prisma.employee.findMany();
    console.log('Employee Data:', employees);
    res.json(employees);
});

// Lookup a single employee by username.
router.post('/getEmployee', async (req, res) => {
    //const auth0Id = req.auth!.payload.sub as string;
    const {username} = req.body;

    if (!username) {
        return res.status(400).send('Missing field required');
    }

    try {
        const employee = await prisma.employee.findUniqueOrThrow({
            where: {
                username: username,
            }
        });
        return res.status(200).json({
            message: 'Employee found',
            data: employee
        });
    } catch (error) {
        res.status(404).json({error: 'User not Found'});
    }
});

// Update employee fields locally and mirror certain changes back to Auth0.
router.patch('/updateEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const token = await getManagementToken();
    const {username, newUsername, password, persona, first_name, last_name, pfp_URL} = req.body;

    if (!username) {
        return res.status(400).send('Current username is required');
    }

    // Build the update payload only with fields that were actually provided.
    const updateData: {
        username?: string;
        password?: string;
        persona?: string;
        first_name?: string;
        last_name?: string;
        pfp_URL?: string;
    } = {};

    if (newUsername) updateData.username = newUsername;
    if (password) updateData.password = password;
    if (persona) updateData.persona = persona;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (pfp_URL) updateData.pfp_URL = pfp_URL;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send('No fields to update');
    }

    try {

        const employee = await prisma.employee.update({
            where: {username: username},
            data: updateData,
        });

        // Keep the Auth0 username in sync when the local username changes.
        if (newUsername) {
            const usernameUpdate = {
                connection: "Username-Password-Authentication",
                username: newUsername,
                //email: `${newUsername}@noemail.internal`
            };

            const res1 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(usernameUpdate),
                }
            );

            if (!res1.ok) {
                const err = await res1.json();
                console.log("Username update failed:", err);
                return res.status(500).json({error: "Failed to update username", details: err});
            }
        }

        // Update the Auth0 profile fields as well, so login claims stay consistent.
        if (newUsername) {
            const usernameUpdate = {
                connection: "Username-Password-Authentication",
                //username: newUsername,
                email: `${newUsername}@noemail.internal`,
                nickname: newUsername
            };

            const res1 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(usernameUpdate),
                }
            );

            if (!res1.ok) {
                const err = await res1.json();
                console.log("Username update failed:", err);
                return res.status(500).json({error: "Failed to update username", details: err});
            }
        }

        // Password changes must be pushed to Auth0, since Auth0 is the identity source.
        if (password) {
            const passwordUpdate = {
                connection: "Username-Password-Authentication",
                password: password
            };

            const res2 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(passwordUpdate),
                }
            );

            if (!res2.ok) {
                const err = await res2.json();
                console.log("Password update failed:", err);
                return res.status(500).json({error: "Failed to update password", details: err});
            }
        }

        // Update role assignment in Auth0 to match the selected persona.
        if (persona) {
            const allRolesRes = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/roles`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );

            const allRoles = await allRolesRes.json();
            const matchedRole = allRoles.find((r: any) => r.name === persona);

            const userRolesRes = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );

            const userRoles = await userRolesRes.json();
            if (userRoles.length > 0) {
                await fetch(
                    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            roles: userRoles.map((r: any) => r.id)
                        })
                    }
                );
            }
            ;

            if (matchedRole) {
                await fetch(
                    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            roles: [matchedRole.id]
                        })
                    }
                );
            }
        }
        ;

        // Maintain the local admin relationship table when persona changes.
        if (persona == 'Admin') {
            await prisma.admin.create({
                data: {
                    adid: employee.empid
                }
            })
        } else {
            await prisma.admin.deleteMany({
                where: {adid: employee.empid},
            });
        }
        return res.status(200).json({
            message: 'Employee updated',
            data: employee
        });
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({error: 'Something went wrong updating employee'});
    }
});

// Create a new employee in Auth0 first, then store the matching local record.
router.post('/addEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {username, password, persona, first_name, last_name, pfp_URL} = req.body;

    if (!username || !password || !first_name || !last_name) {
        return res.status(400).send('Missing field required');
    }

    console.log('Adding employee:', {username, password, persona, first_name, last_name, pfp_URL});
    try {
        const token = await getManagementToken();

        const createRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                connection: 'Username-Password-Authentication',
                username,
                password,
                email: `${username}@noemail.internal`,
                email_verified: true,
            }),
        });

        const userData = await createRes.json();
        const auth0UserId = userData.user_id;

        // Assign the Auth0 role that matches the selected persona.
        const rolesRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/roles`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const rolesData = await rolesRes.json();
        const matchedRole = rolesData.find((r: any) => r.name === persona);

        if (matchedRole) {
            await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${auth0UserId}/roles`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roles: [matchedRole.id],
                    }),
                }
            );
        }

        // Admin users get an extra local admin record for fast role checks.
        if (persona.trim() == 'Admin') {
            const newAdmin = await prisma.employee.create({
                data: {
                    auth0Id: userData.user_id,
                    username,
                    password,
                    persona,
                    first_name,
                    last_name,
                    created_at: new Date(),
                    admin: {
                        create: {}
                    }
                },
            })
            return res.status(200).json({
                message: 'new admin added',
                data: newAdmin
            });
        } else {

            const newEmp = await prisma.employee.create({
                data: {
                    auth0Id: userData.user_id,
                    username,
                    password,
                    persona,
                    first_name,
                    last_name,
                    created_at: new Date(),
                    pfp_URL: pfp_URL || null
                },
            });
            return res.status(200).json({
                message: 'new employee added',
                data: newEmp
            });
        }
    } catch (error) {
        console.error('Add employee error:', error);
        res.status(500).json({error: 'Server error'});
    }
});

// Remove the employee from Auth0 first, then delete the local database row.
router.delete('/deleteEmployee/:name', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const {name} = req.params;

        const user = await prisma.employee.findUnique({
            where: {username: name}
        });

        if (!user) {
            return res.status(404).send('Not Found');
        }

        const token = await getManagementToken();

        const deleteRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user.auth0Id)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                },
            }
        );

        if (deleteRes.status !== 204) {
            const error = await deleteRes.json();
            return res.status(500).json({error: 'Failed to delete from Auth0', details: error});
        }

        const deletedEmp = await prisma.employee.delete({
            where: {username: name}
        });

        return res.status(200).json({
            message: 'Employee removed',
            data: deletedEmp
        })
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Upload and store a profile picture in Supabase, then save the public URL locally.
router.post('/employees/:empid/profile-picture', upload.single('file'), async (req, res) => {
    try {
        const empid = Number(req.params.empid);
        const file = req.file;
        if (!empid || !file) return res.status(400).json({error: 'empid and file are required'});
        if (!file.mimetype.startsWith('image/')) return res.status(400).json({error: 'Only image uploads are allowed'});

        const employee = await prisma.employee.findUnique({where: {empid}});
        if (!employee) return res.status(404).json({error: 'Employee not found'});

        const safeName = file.originalname.replace(/\s+/g, '_');
        const path = `employee-profiles/${empid}/avatar-${Date.now()}-${safeName}`;

        const {error: uploadError} = await supabase.storage
            .from('Employee Media') //direct to Employee Media bucket
            .upload(path, file.buffer, {contentType: file.mimetype, upsert: true});

        if (uploadError) return res.status(500).json({error: 'Upload failed', details: uploadError.message});

        const {data: urlData} = supabase.storage.from('Employee Media').getPublicUrl(path);

        const updated = await prisma.employee.update({
            where: {empid},
            data: {pfp_URL: urlData.publicUrl}
        });

        return res.status(200).json({message: 'Profile picture uploaded', data: updated});
    } catch (e) {
        return res.status(500).json({error: 'Unexpected error'});
    }
});

// Update the employee's theme preference in the local database.
router.post('/updateTheme', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {empid, theme} = req.body;
    if (!empid || theme === undefined) {
        return res.status(400).send('Missing field required, need to provide theme');
    }

    try {
        const employee = await prisma.employee.update({
            where: {empid: empid},
            data: {theme: theme}
        });
        return res.status(200).json({
            message: 'Theme updated',
            data: employee
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

export default router;