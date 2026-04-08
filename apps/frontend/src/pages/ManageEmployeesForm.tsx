import {useEffect, useState} from 'react';
import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"

export function ManageEmployeesForm() {
   const [formData, setFormData] = useState({
        full_name: '', edits: '', employee: '', priority: '', email: '', comments: ''
    });

    const handleSubmit = async () => {
        await fetch('http://localhost:3000/employee_manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        setFormData({ full_name: '', edits: '', employee: '', priority: '', email: '', comments: '' });
    };

    const [employees, setEmployees] = useState<string[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/employees')
            .then(res => res.json())
            .then(data => setEmployees(data.map((e: {username: string}) => e.username)));
    }, []);

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
                    <label htmlFor="fullname">Your Full Name:</label>
                    <input type="text" id="fullname" name="fullname"/>
                    <br/><br/><br/><br/>

                    <h2>Permissions Section</h2>
                    <br />

                    {/* Question 2 */}
                    <h3> What employee edits are you trying to make? </h3>
                    <br/>

                    <div>
                        <input type="radio" id="updatePermissions" name="employeeEdits" value="Update Employee Permissions"
                               onChange={() => setFormData({...formData, edits: 'Update Employee Permissions.'})}/>
                        <label htmlFor="updatePermissions">Update Employee Permissions. </label>
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

                    {/* Question 3 */}
                    <label htmlFor="employeeSelect">What Employee are you Updating Status for?</label>
                    <select name="employeeSelect" id="employeeSelect"
                            onChange={e => setFormData({...formData, employee: e.target.value})}>
                        <option value="">Select...</option>
                        {employees.map(username => (
                            <option key={username} value={username}>{username}</option>
                        ))}
                    </select>

                    {/* Question 4 */}
                    <h3> What priority is this? </h3>
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

                    {/* Question 5 */}
                    <h3> Should the Employee be emailed a notice of this Request </h3>
                    <br/>

                    <input type="radio" id="yesNoticeEmail" name="noticeEmail" value="Yes"
                           onChange={() => setFormData({...formData, email: 'Yes.'})}/>
                    <label htmlFor="yesNoticeEmail">Yes.</label>

                    <input type="radio" id="noNoticeEmail" name="noticeEmail" value="No"
                           onChange={() => setFormData({...formData, email: 'No.'})}/>
                    <label htmlFor="noNoticeEmail">No.</label>
                    <br/><br/>

                    {/* Comment Box */}
                    <label htmlFor="comments">Comments</label><br/>
                    <textarea id="comments" value={formData.comments}
                              onChange={e => setFormData({...formData, comments: e.target.value})}></textarea>
                    <br/>

                    <button type="reset">Reset</button><button type="submit">Submit</button>
                </form>
            </>
        );
    } else {
        return <AccessDenied />;
    }
}
