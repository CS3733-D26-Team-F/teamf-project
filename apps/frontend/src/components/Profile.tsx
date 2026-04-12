
import {IconChevronDown} from '@tabler/icons-react';
import {Link} from 'react-router-dom';
import { Button, Menu } from '@mantine/core';

export function Profile() {

    return (
        <div className="profile-link" aria-label="Signed in user" >
            
            <Menu
            transitionProps={{transition: 'pop-top-right'}}
            position="top-end"
            width={220}>
                <Menu.Target>
                    <Button rightSection={<IconChevronDown size={18} />} pr={5} variant="filled" color="primary">
                    <img src="https://via.placeholder.com/40" alt="Profile" />
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
                    <Menu.Item component="button" onClick={() => localStorage.setItem('persona', 'Guest')}>
                        <Link to="/" style={{ color: 'var(--color-yale-blue)' }}>Logout</Link>
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    );
}
