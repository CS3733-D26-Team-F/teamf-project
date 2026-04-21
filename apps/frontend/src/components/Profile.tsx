import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from 'react';
import { Button, Menu, Modal, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DOMAIN } from '../const';
import { useDisclosure } from "@mantine/hooks";
import ThemeToggle from "./ThemeToggle";

// Lightweight fallback avatar shown when no custom profile picture is available.
const placeholderProfilePicture =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="#D8E0EA"/><circle cx="60" cy="48" r="20" fill="#8FA3B7"/><path d="M28 98c6-18 20-27 32-27s26 9 32 27" fill="#8FA3B7"/></svg>'
    );

export function Profile() {
    // Initialize from localStorage so the header can render immediately on page load.
    const [profilePicture, setProfilePicture] = useState<string | undefined>(() => (
        localStorage.getItem('pfp_URL') ?? localStorage.getItem('profilePicture') ?? undefined
    ));
    const { user, logout } = useAuth0();
    // Mantine disclosure hook manages the Settings modal open/close state.
    const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

    // Prefer employee name, then username, then Auth0 nickname as the display label.
    const displayName =
        localStorage.getItem('first_name') && localStorage.getItem('first_name') !== 'undefined'
            ? localStorage.getItem('first_name')
            : localStorage.getItem('username') && localStorage.getItem('username') !== 'undefined'
                ? localStorage.getItem('username')
                : user?.nickname || 'User';

    useEffect(() => {
        // Use the saved username first, then fall back to the Auth0 nickname.
        const username = localStorage.getItem('username') || user?.nickname;
        
        if (!username) {
            return;
        }

        // Refresh employee details from the backend so localStorage stays current.
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

                // Keep the latest profile picture in state for immediate UI updates.
                const url = employee.pfp_URL ?? undefined;
                setProfilePicture(url);

                // Sync commonly used profile fields into localStorage for the rest of the app.
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

                // Save the image URL when present; otherwise fall back to the placeholder avatar.
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

    // Clear local session data before sending the user back to the app's landing origin.
    function handleLogout() {
        localStorage.clear();
        sessionStorage.removeItem('chatHistory');
        logout({ logoutParams: { returnTo: window.location.origin } });
    }

    // Hide the profile menu entirely for guest/unauthenticated visitors.
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
                                        // Replace broken images with the fallback avatar.
                                        setProfilePicture(placeholderProfilePicture);
                                        event.currentTarget.src = placeholderProfilePicture;
                                    }}
                                />
                                <span><h3>{displayName}</h3></span>
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {/* Quick actions for profile navigation, settings, and sign-out. */}
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
                    {/* Theme controls live in the settings modal to keep the header compact. */}
                    <ThemeToggle />
                </Modal>
            </>
        );
    }

    return null;
}
