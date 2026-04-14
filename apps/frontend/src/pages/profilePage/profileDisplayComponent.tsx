import '@mantine/core/styles.css';
import {
    TextInput, Button, Modal, Select, MultiSelect, Group, Text,
    Badge, Stack, Box, Table, Checkbox, Image,
    Tooltip
} from '@mantine/core';

export function ProfileComponent() {
    return (
        <div id="profile-component"
        
        style={{ width:'80%', padding: '20px', alignContent: 'center', position: 'relative', background:'white', borderRadius:12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', cursor: 'pointer',
                transition: 'box-shadow 0.15s', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 16 }}>
            <Table>
                <thead>
                    <tr>
                        <th>{localStorage.getItem('first_name')}</th>
                        <th>{localStorage.getItem('persona')}</th>

                    </tr>
                    <tr>
                        <td><Image src={localStorage.getItem('pfp_URL')} alt="Profile" /></td>
                        <td>Email: {localStorage.getItem('email')}</td>
                    </tr>
                </thead>

            </Table>
        </div>
    );
}
