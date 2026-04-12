import {useEffect, useState} from 'react';
import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { EmployeesTitle } from "../components/ManageEmployees/Title.tsx";

export function ManageEmployeesForm() {
    const [formData, setFormData] = useState({
        full_name: '', edits: '', employee: '', priority: '', email: '', comments: ''
    });

    const [newEmployeeData, setNewEmployeeData] = useState({
        username: '', password: '', persona: ''
    });

    const [updateEmployeeData, setUpdateEmployeeData] = useState({
        username: '', newUsername: '', password: '', persona: ''
    });

    const [deleteEmployeeData, setDeleteEmployeeData] = useState({
        username: ''
    });

    const [employees, setEmployees] = useState<string[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/employees')
            .then(res => res.json())
            .then(data => setEmployees(data.map((e: {username: string}) => e.username)));
    }, []);

    const handleSubmit = async () => {
        if (formData.edits === 'Add a new Employee.') {
            await fetch('http://localhost:3000/addEmployee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployeeData)
            });
            setNewEmployeeData({username: '', password: '', persona: ''});

        } else if (formData.edits === 'Update Employee Permissions.') {
            await fetch('http://localhost:3000/updateEmployee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateEmployeeData)
            });
            setUpdateEmployeeData({username: '', newUsername: '', password: '', persona: ''});

        } else if (formData.edits === 'Remove an Employee.') {
            await fetch(`http://localhost:3000/deleteEmployee/${deleteEmployeeData.username}`, {
                method: 'DELETE',
            });
            setDeleteEmployeeData({username: ''});

        } else {
            await fetch('http://localhost:3000/employee_manage', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
        }
        setFormData({full_name: '', edits: '', employee: '', priority: '', email: '', comments: ''});
    };

    const allowedAccess = localStorage.getItem('persona') === 'Admin';
    if (allowedAccess) {
        return (
            <>
                <Header />
                <br />
                <form onSubmit={handleSubmit} className="content-management">
                    <h1>Employee Management Form</h1>
                    <br/>
                    <hr/>
                    <br/>
                    <label htmlFor="full_name">Your Full Name:</label>
                    <input type="text" id="full_name" name="full_name" value={formData.full_name}
                           onChange={e => setFormData({...formData, full_name: e.target.value})}/>
                    <br/><br/><br/><br/>

                    <h2>Permissions Section</h2>
                    <br/>

                    <h3>What employee edits are you trying to make?</h3>
                    <br/>

                    <div>
                        <input type="radio" id="updatePermissions" name="employeeEdits" value="Update Employee Permissions"
                               onChange={() => setFormData({...formData, edits: 'Update Employee Permissions.'})}/>
                        <label htmlFor="updatePermissions">Update Employee Permissions.</label>
                    </div>
                    <div>
                        <input type="radio" id="addEmployee" name="employeeEdits" value="Add a new Employee"
                               onChange={() => setFormData({...formData, edits: 'Add a new Employee.'})}/>
                        <label htmlFor="addEmployee">Add a new Employee.</label>
                    </div>
                    <div>
                        <input type="radio" id="removeEmployee" name="employeeEdits" value="Remove an Employee"
                               onChange={() => setFormData({...formData, edits: 'Remove an Employee.'})}/>
                        <label htmlFor="removeEmployee">Remove an Employee.</label>
                    </div>
                    <div>
                        <input type="radio" id="other" name="employeeEdits" value="Other"
                               onChange={() => setFormData({...formData, edits: 'Other'})}/>
                        <label htmlFor="other">Other</label>
                    </div>

                    <br/><br/>

                    {/*add new employee fields*/}
                    {formData.edits === 'Add a new Employee.' && (
                        <>
                            <h3>New Employee Details</h3>
                            <label>Username:</label>
                            <input type="text" value={newEmployeeData.username}
                                   onChange={e => setNewEmployeeData({...newEmployeeData, username: e.target.value})}/>
                            <br/>
                            <label>Password:</label>
                            <input type="password" value={newEmployeeData.password}
                                   onChange={e => setNewEmployeeData({...newEmployeeData, password: e.target.value})}/>
                            <br/>
                            <label>Persona:</label>
                            <select value={newEmployeeData.persona}
                                    onChange={e => setNewEmployeeData({...newEmployeeData, persona: e.target.value})}>
                                <option value="">Select...</option>
                                <option value="Underwriter">Underwriter</option>
                                <option value="Business Analyst">Business Analyst</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <br/><br/>
                        </>
                    )}

                    {/*upd employee fields*/}
                    {formData.edits === 'Update Employee Permissions.' && (
                        <>
                            <h3>Update Employee Details</h3>
                            <label>Current Username:</label>
                            <select value={updateEmployeeData.username}
                                    onChange={e => setUpdateEmployeeData({...updateEmployeeData, username: e.target.value})}>
                                <option value="">Select...</option>
                                {employees.map(username => (
                                    <option key={username} value={username}>{username}</option>
                                ))}
                            </select>
                            <br/>
                            <label>New Username (optional):</label>
                            <input type="text" value={updateEmployeeData.newUsername}
                                   onChange={e => setUpdateEmployeeData({...updateEmployeeData, newUsername: e.target.value})}/>
                            <br/>
                            <label>New Password (optional):</label>
                            <input type="password" value={updateEmployeeData.password}
                                   onChange={e => setUpdateEmployeeData({...updateEmployeeData, password: e.target.value})}/>
                            <br/>
                            <label>New Persona (optional):</label>
                            <select value={updateEmployeeData.persona}
                                    onChange={e => setUpdateEmployeeData({...updateEmployeeData, persona: e.target.value})}>
                                <option value="">Select...</option>
                                <option value="Underwriter">Underwriter</option>
                                <option value="Business Analyst">Business Analyst</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <br/><br/>
                        </>
                    )}

                    {/*rmv employee fields*/}
                    {formData.edits === 'Remove an Employee.' && (
                        <>
                            <h3>Remove Employee</h3>
                            <label>Username to Remove:</label>
                            <select value={deleteEmployeeData.username}
                                    onChange={e => setDeleteEmployeeData({username: e.target.value})}>
                                <option value="">Select...</option>
                                {employees.map(username => (
                                    <option key={username} value={username}>{username}</option>
                                ))}
                            </select>
                            <br/><br/>
                        </>
                    )}

                    {/*show general fields only for other*/}
                    {formData.edits === 'Other' && (
                        <>
                            <label htmlFor="employeeSelect">What Employee are you Updating Status for?</label>
                            <select name="employeeSelect" id="employeeSelect"
                                    onChange={e => setFormData({...formData, employee: e.target.value})}>
                                <option value="">Select...</option>
                                {employees.map(username => (
                                    <option key={username} value={username}>{username}</option>
                                ))}
                            </select>
                            <br/><br/>

                            <h3>What priority is this?</h3>
                            <br/>
                            <input type="radio" id="HighPriority" name="EditPriority" value="Highest Priority"
                                   onChange={() => setFormData({...formData, priority: 'Highest Priority'})}/>
                            <label htmlFor="HighPriority">Highest Priority</label>

                            <input type="radio" id="RegularPriority" name="EditPriority" value="Regular Priority"
                                   onChange={() => setFormData({...formData, priority: 'Regular Priority'})}/>
                            <label htmlFor="RegularPriority">Regular Priority</label>

                            <input type="radio" id="LowPriority" name="EditPriority" value="Low Priority"
                                   onChange={() => setFormData({...formData, priority: 'Low Priority'})}/>
                            <label htmlFor="LowPriority">Low Priority</label>
                            <br/><br/>

                            <h3>Should the Employee be emailed a notice of this request?</h3>
                            <br/>
                            <input type="radio" id="yesNoticeEmail" name="noticeEmail" value="Yes"
                                   onChange={() => setFormData({...formData, email: 'Yes.'})}/>
                            <label htmlFor="yesNoticeEmail">Yes.</label>

                            <input type="radio" id="noNoticeEmail" name="noticeEmail" value="No"
                                   onChange={() => setFormData({...formData, email: 'No.'})}/>
                            <label htmlFor="noNoticeEmail">No.</label>
                            <br/><br/>
                        </>
                    )}

                    {/*comments*/}
                    <label htmlFor="comments">Comments</label><br/>
                    <textarea id="comments" value={formData.comments}
                              onChange={e => setFormData({...formData, comments: e.target.value})}></textarea>
                    <br/>

                    <button type="reset">Reset</button>
                    <button type="submit">Submit</button>
                </form>
                <EmployeesTitle />
                <EmployeeListView />
            </>
        );
    } else {
        return <AccessDenied />;
    }
}
