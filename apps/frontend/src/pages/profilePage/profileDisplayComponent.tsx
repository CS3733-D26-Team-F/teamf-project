import '@mantine/core/styles.css';
import {
    Table, Image
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { DOMAIN } from '../../const';
import { useTranslation } from 'react-i18next';


// Fallback image shown when the user does not have a stored profile picture yet.
const placeholder = '/default-profile-picture.png';

export function ProfileComponent() {
    const { t } = useTranslation();
    // Initialize from localStorage so the profile card can render immediately
    // without waiting for the network request.
    const [profileImage, setProfileImage] = useState<string>(() => (
        localStorage.getItem('pfp_URL') || localStorage.getItem('profilePicture') || placeholder
    ));

    useEffect(() => {
        // Username is required to look up the employee record on the backend.
        const username = localStorage.getItem('username');
        if (!username) {
            return;
        }

        // Fetch the latest profile image URL so local storage stays in sync
        // with the backend if the user updated their picture elsewhere.
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
                const imageUrl = payload?.data?.pfp_URL;
                if (imageUrl) {
                    setProfileImage(imageUrl);
                    localStorage.setItem('pfp_URL', imageUrl);
                }
            })
            .catch(() => {
                // Keep existing localStorage fallback if the request fails.
            });
    }, []);

    return (
        <div id="profile-component"
        
        style={{ width:'80%', margin: '0 auto', padding: '20px', alignContent: 'center', position: 'relative', background:'white', borderRadius:12, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', cursor: 'pointer',
                transition: 'box-shadow 0.15s', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 16 }}>
            
            <Table  style={{ padding: '20px' }}>
                
                <thead id="profile-header" style={{ padding: '20px' }}>
                    <tr>
                        <th>{t('user')}: {localStorage.getItem('first_name')}</th>
                        <th>{t('role')}: {localStorage.getItem('persona')}</th>

                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {/* Profile image is loaded from the backend when available, otherwise fallback is used. */}
                        <td><Image src={profileImage} style={{ width: 200, height: 200 }} alt="Profile" /></td>
                        <td>{t ('email')}: {localStorage.getItem('email')}</td>
                    </tr>
                    <tr>
                        <td>{t ('username')}: {localStorage.getItem('username')}</td>
                        <td>{t ('employee_id')}: {localStorage.getItem('empid')}</td>
                    </tr>
                </tbody>

            </Table>
        </div>
    );
}
