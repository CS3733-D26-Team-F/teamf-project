
import { useEffect, useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DOMAIN } from '../const';

const placeholderProfilePicture =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="#D8E0EA"/><circle cx="60" cy="48" r="20" fill="#8FA3B7"/><path d="M28 98c6-18 20-27 32-27s26 9 32 27" fill="#8FA3B7"/></svg>'
    );

export function Profile() {
    const [profilePicture, setProfilePicture] = useState<string | undefined>(
        localStorage.getItem('pfp_URL') ?? undefined
    );
    const displayName =
        localStorage.getItem('first_name') && localStorage.getItem('first_name') !== 'undefined'
            ? localStorage.getItem('first_name')
            : localStorage.getItem('username') && localStorage.getItem('username') !== 'undefined'
                ? localStorage.getItem('username')
                : 'User';

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
                    setProfilePicture(placeholderProfilePicture);
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
                        <img id="profile-picture"
                            src={profilePicture ?? placeholderProfilePicture}
                            alt="Profile"
                            onError={(event) => {
                                setProfilePicture(placeholderProfilePicture);
                                event.currentTarget.src = placeholderProfilePicture;
                            }}
                        />
                        <span><h3>{displayName}</h3></span>
                        </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <span><h3>Username:{localStorage.getItem('username')}</h3></span>
                        <Menu.Item component="button" >
                            <Link to="/profilePage" style={{ color: 'var(--color-yale-blue)' }}>Profile</Link>
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
