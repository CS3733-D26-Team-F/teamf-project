import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from 'react';
import { Button, Menu, Modal, px, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DOMAIN } from '../const';
import { useDisclosure } from "@mantine/hooks";
import ThemeToggle from "./ThemeToggle";

const placeholderProfilePicture =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="#D8E0EA"/><circle cx="60" cy="48" r="20" fill="#8FA3B7"/><path d="M28 98c6-18 20-27 32-27s26 9 32 27" fill="#8FA3B7"/></svg>'
    );

export function Profile() {
    const [profilePicture, setProfilePicture] = useState<string | undefined>(() => (
        localStorage.getItem('pfp_URL') ?? localStorage.getItem('profilePicture') ?? undefined
    ));
    const { user, logout } = useAuth0();
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    const displayName =
        localStorage.getItem('first_name') && localStorage.getItem('first_name') !== 'undefined'
            ? localStorage.getItem('first_name')
            : localStorage.getItem('username') && localStorage.getItem('username') !== 'undefined'
                ? localStorage.getItem('username')
                : user?.nickname || 'User';

    useEffect(() => {
        const username = localStorage.getItem('username') || user?.nickname;
        
        if (!username) {
            return;
        }

        fetch(`${DOMAIN}/getEmployee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        })
            .then((res) => {
                if (!res.ok) {
                    return null;
                }
                return res.json();
            })
            .then((payload) => {
                const employee = payload?.data;
                if (!employee) {
                    return;
                }

                const url = employee.pfp_URL ?? undefined;
                setProfilePicture(url);

                if (employee.username) {
                    localStorage.setItem('username', employee.username);
                }
                if (employee.first_name) {
                    localStorage.setItem('first_name', employee.first_name);
                }
                if (employee.persona) {
                    localStorage.setItem('persona', employee.persona);
                }
                if (employee.empid) {
                    localStorage.setItem('empid', String(employee.empid));
                }

                if (url) {
                    localStorage.setItem('pfp_URL', url);
                } else {
                    localStorage.removeItem('pfp_URL');
                    setProfilePicture(placeholderProfilePicture);
                }
            })
            .catch(() => {
                // Keep existing localStorage fallback if the request fails.
            });
    }, [user?.nickname]);

    function handleLogout() {
        localStorage.clear();
        logout({ logoutParams: { returnTo: window.location.origin } });
    }

    if (localStorage.getItem('persona') !== 'Guest' || localStorage.getItem('username') !== null) {
        return (
            <>
                <div className="profile-link" aria-label="Signed in user" >
                    <Menu transitionProps={{ transition: 'pop-top-right' }} position="top-end" width={190}>
                        <Menu.Target>
                            <Button style={{height: '50px'}} rightSection={<IconChevronDown size={18} />} pr={20} variant="filled" color="primary">
                                <img
                                    id="profile-picture"
                                    src={profilePicture ?? placeholderProfilePicture}
                                    alt="Profile"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        marginRight: 8,
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        display: 'block',
                                        flexShrink: 1,
                                        backgroundColor: 'var(--color-white)',
                                        border: '1px solid var(--color-pale-sky)',
                                    }}
                                    onError={(event) => {
                                        setProfilePicture(placeholderProfilePicture);
                                        event.currentTarget.src = placeholderProfilePicture;
                                    }}
                                />
                                <span><h3>{displayName}</h3></span>
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>Username: {localStorage.getItem('username') || user?.nickname}</Menu.Label>
                            <Menu.Item component={Link} to="/profilePage">Profile</Menu.Item>
                            <Menu.Item onClick={openSettings}>Settings</Menu.Item>
                            <Menu.Item onClick={handleLogout}>Logout</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>

                <Modal
                    opened={settingsOpened}
                    onClose={closeSettings}
                    title={<Text fw={700} size="xl" c="var(--color-yale-blue)">Settings</Text>}
                >
                    <ThemeToggle />
                </Modal>
            </>
        );
    }

    return null;
}
