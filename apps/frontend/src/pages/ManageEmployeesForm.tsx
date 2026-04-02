import { Header } from "../components/Header"

export function ManageEmployeesForm() {
    return (
        <>
            <Header />

            <form>
                <h1>Employee Management Form</h1>
                <br/>
                <hr />
                <br />
            <label htmlFor="fullname">Your Full Name:</label>
            <input type="text" id="fullname" name="fullname"/>
            <br/><br/><br/><br/>

            <h2>Permissions Section</h2>
                <br />

            {/* Question 2 */}
            <h3> What employee edits are you trying to make? </h3>
            <br/>
                <div>
            <input type="radio" id="updatePermissions" name="employeeEdits"/>
            <label htmlFor="updatePermissions">Update Employee Permissions. </label>
                </div>
            <div>
            <input type="radio" id="addEmployee" name="employeeEdits"/>
            <label htmlFor="addEmployee">Add a new Employee.</label>
            </div>
            <div>
            <input type="radio" id="removeEmployee" name="employeeEdits"/>
            <label htmlFor="removeEmployee">Remove an Employee.</label>
            </div>
            <div>
            <input type="radio" id="other" name="employeeEdits"/>
            <label htmlFor="other">Other</label>
            </div>
            <br/><br/>

            {/* Question 3 */}
            <label htmlFor="employeeSelect">What Employee are you Updating Status for?</label>
            <select name="employeeSelect" id="employeeSelect">
                <optgroup label="Default">
                    <option value="">Select...</option>
                </optgroup>
                <optgroup label="BackEnd">
                    <option value="">John</option>
                    <option value="">Berenis</option>
                    <option value="">Andrew</option>
                    <option value="">Milan</option>
                    <option value="">Bowen</option>
                </optgroup>
                <optgroup label="FrontEnd">
                    <option value="">Molly</option>
                    <option value="">Chloe</option>
                    <option value="">Jeremia</option>
                    <option value="">Adrian</option>
                    <option value="">Ryan</option>
                </optgroup>
                <optgroup label="Administration">
                    <option value="">Professor Wilson Wong</option>
                    <option value="">Phuong Tran</option>
                </optgroup>
            </select>

            {/* Question 4 */}
            <h3> What priority is this? </h3>
            <br/>

            <input type="radio" id="HighPriority" name="EditPriority"/>
            <label htmlFor="HighPriority">Highest Priority</label>

            <input type="radio" id="addEmployee" name="EditPriority"/>
            <label htmlFor="addEmployee">Regular Priority</label>

            <input type="radio" id="removeEmployee" name="EditPriority"/>
            <label htmlFor="removeEmployee">Low Priority</label>
            <br/><br/>

            {/* Question 5 */}
            <h3> Should the Employee be emailed a notice of this Request </h3>
            <br/>

            <input type="radio" id="yesNoticeEmail" name="noticeEmail"/>
            <label htmlFor="yesNoticeEmail">Yes.</label>

            <input type="radio" id="noNoticeEmail" name="noticeEmail"/>
            <label htmlFor="noNoticeEmail">No.</label>
            <br/><br/>

            {/* Comment Box */}
            <label htmlFor="comments">Comments</label><br/>
            <textarea id="comments"></textarea>
            <br/>

            <button type="reset">Reset</button><button type="submit">Submit</button>
            </form>
        </>
    );
}