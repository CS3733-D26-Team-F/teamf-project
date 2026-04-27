import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spotlight } from '@mantine/spotlight';
import '@mantine/spotlight/styles.css';
import {
    IconHome, IconFileText, IconArchive,
    IconUsers, IconBrightnessUp, IconBell, IconUserCircle,
} from '@tabler/icons-react';

export function CommandPalette() {
    const navigate = useNavigate();
    const [persona, setPersona] = useState(localStorage.getItem('persona') || 'Guest');

    useEffect(() => {
        const handleStorageChange = () => setPersona(localStorage.getItem('persona') || 'Guest');
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const actions = [
        {
            id: 'home',
            label: 'Home',
            description: 'Return to the main dashboard',
            onClick: () => navigate('/'),
            leftSection: <IconHome size={20} stroke={1.5} />,
        },
        {
            id: 'documents',
            label: 'Documents',
            description: 'View and manage your files',
            onClick: () => navigate('/documents'),
            leftSection: <IconFileText size={20} stroke={1.5} />,
        },
        {
            id: 'archive',
            label: 'Archive',
            description: 'View expired and archived documents',
            onClick: () => navigate('/archive'),
            leftSection: <IconArchive size={20} stroke={1.5} />,
        },
        {
            id: 'toggle-theme',
            label: 'Toggle High Visibility Theme',
            description: 'Switch between default and colorblind modes',
            onClick: () => {
                const current = localStorage.getItem('theme');
                const next = current === 'high-visibility' ? 'default' : 'high-visibility';
                localStorage.setItem('theme', next);
                document.documentElement.setAttribute('data-theme', next === 'high-visibility' ? 'high-visibility' : ' ');
                window.dispatchEvent(new Event('storage'));
            },
            leftSection: <IconBrightnessUp size={20} stroke={1.5} />,
        },
        {
            id: 'notifications',
            label: 'Notifications',
            description: 'View notifications',
            onClick: () => navigate('/notifications'),
            leftSection: <IconBell size={20} stroke={1.5} />,
        },
        {
            id: 'profile',
            label: 'Profile',
            description: 'View Profile',
            onClick: () => navigate('/profilePage'),
            leftSection: <IconUserCircle size={20} stroke={1.5} />,
        }
    ];

    if (persona === 'Admin') {
        actions.push({
            id: 'employees',
            label: 'Manage Employees',
            description: 'Add, edit, or remove staff accounts',
            onClick: () => navigate('/manageemployees'),
            leftSection: <IconUsers size={20} stroke={1.5} />,
        });
    }

    return (
        <Spotlight
            actions={actions}
            nothingFound="Nothing found..."
            highlightQuery
            searchProps={{
                placeholder: 'Jump to...',
                leftSection: <IconFileText size={20} stroke={1.5} />,
            }}
            shortcut={['mod + K', 'mod + P', '/']}
        />
    );
}