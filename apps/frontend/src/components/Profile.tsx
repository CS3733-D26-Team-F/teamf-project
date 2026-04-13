
import { Button, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function Profile() {

    if (localStorage.getItem('persona') !== 'Guest' || localStorage.getItem('username') !== null) {
        return (
            <div className="profile-link" aria-label="Signed in user" >
                
                <Menu
                transitionProps={{transition: 'pop-top-right'}}
                position="top-end"
                width={150}>
                    <Menu.Target>
                        <Button rightSection={<IconChevronDown size={18} />} pr={20} variant="filled" color="primary">
                        <img src={localStorage.getItem('profilePicture') ?? undefined} alt="Profile" />
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
