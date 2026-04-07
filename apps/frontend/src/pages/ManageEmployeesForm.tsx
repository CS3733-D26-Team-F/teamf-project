import { useState } from 'react';
import { Header } from "../components/Header"

export function ManageEmployeesForm() {
    const [formData, setFormData] = useState({
        full_name: '', edits: '', personstatus: '', priority: '', email: '', comments: ''
    });

    const handleSubmit = async () => {
        await fetch('http://localhost:3000/employee_manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        setFormData({ full_name: '', edits: '', personstatus: '', priority: '', email: '', comments: '' });
    };

    return (
        <>
            <Header />
            <br />

            <form onSubmit={handleSubmit}>
                <h1>Employee Management Form</h1>
                <br/>
                <hr />
                <br />
                <label htmlFor="full_name">Your Full Name:</label>
                <input type="text" id="full_name" name="full_name" value={formData.full_name}
                       onChange={e => setFormData({...formData, full_name: e.target.value})}/>
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
                        onChange={e => setFormData({...formData, personstatus: e.target.value})}>
                    <optgroup label="Default">
                        <option value="">Select...</option>
                    </optgroup>
                    <optgroup label="BackEnd">
                        <option value="John">John</option>
                        <option value="Berenis">Berenis</option>
                        <option value="Andrew">Andrew</option>
                        <option value="Milan">Milan</option>
                        <option value="Bowen">Bowen</option>
                    </optgroup>
                    <optgroup label="FrontEnd">
                        <option value="Molly">Molly</option>
                        <option value="Chloe">Chloe</option>
                        <option value="Jeremia">Jeremia</option>
                        <option value="Adrian">Adrian</option>
                        <option value="Ryan">Ryan</option>
                    </optgroup>
                    <optgroup label="Administration">
                        <option value="Professor Wilson Wong">Professor Wilson Wong</option>
                        <option value="Phuong Tran">Phuong Tran</option>
                    </optgroup>
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
}