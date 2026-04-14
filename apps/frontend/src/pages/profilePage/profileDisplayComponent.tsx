import '@mantine/core/styles.css';
import {
    Button, Modal, Select, MultiSelect, Group, Text,
    Badge, Stack, Box, Table, Checkbox, Image,
    Tooltip
} from '@mantine/core';

const placeholder = '/default-profile-picture.png';

export function ProfileComponent() {
    return (
        <div id="profile-component"
        
        style={{ width:'80%', margin: '0 auto', padding: '20px', alignContent: 'center', position: 'relative', background:'white', borderRadius:12, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', cursor: 'pointer',
                transition: 'box-shadow 0.15s', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 16 }}>
            
            <Table  style={{ padding: '20px' }}>
                
                <thead id="profile-header" style={{ padding: '20px' }}>
                    <tr>
                        <th>{localStorage.getItem('first_name')}</th>
                        <th>Role: {localStorage.getItem('persona')}</th>

                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Image src={localStorage.getItem('pfp_URL') || placeholder} style={{ width: 200, height: 200 }} alt="Profile" /></td>
                        <td>Email: {localStorage.getItem('email')}</td>
                    </tr>
                    <tr>
                        <td>Username: {localStorage.getItem('username')}</td>
                        <td>Employee ID: {localStorage.getItem('empid')}</td>
                    </tr>
                </tbody>

            </Table>
        </div>
    );
}
