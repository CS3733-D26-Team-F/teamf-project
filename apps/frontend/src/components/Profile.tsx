
import { useEffect, useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DOMAIN } from '../const';

export function Profile() {
    const [profilePicture, setProfilePicture] = useState<string | undefined>(
        localStorage.getItem('pfp_URL') ?? undefined
    );

    useEffect(() => {
        const username = localStorage.getItem('username');
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
                const url = payload?.data?.pfp_URL ?? undefined;
                setProfilePicture(url);
                if (url) {
                    localStorage.setItem('pfp_URL', url);
                } else {
                    localStorage.removeItem('pfp_URL');
                }
            })
            .catch(() => {
                // Keep existing localStorage fallback if the request fails.
            });
    }, []);

    if (localStorage.getItem('persona') !== 'Guest' || localStorage.getItem('username') !== null) {
        return (
            <div className="profile-link" aria-label="Signed in user" >
                
                <Menu
                transitionProps={{transition: 'pop-top-right'}}
                position="top-end"
                width={150}>
                    <Menu.Target>
                        <Button rightSection={<IconChevronDown size={18} />} pr={20} variant="filled" color="primary">
                        <img src={profilePicture} alt="Profile" />
                        <span>{localStorage.getItem('username') || 'Guest'}</span>
                        </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item component="button" >
                            <Link to="/profile" style={{ color: 'var(--color-yale-blue)' }}>Profile</Link>
                        </Menu.Item>
                        <Menu.Item component="button" >
                            <Link to="/settings" style={{ color: 'var(--color-yale-blue)' }}>Settings</Link>
                        </Menu.Item>
                        <Menu.Item component="button" onClick={() => logOff() } >
                            <Link to="/ " style={{ color: 'var(--color-yale-blue)' }}>Logout</Link>
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </div>
        );
    }

    return null;
}

function logOff() {
    //hardcoded log off function -- clear local storage
    localStorage.clear();
}
