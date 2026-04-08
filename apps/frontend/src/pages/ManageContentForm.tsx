import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"

export function ManageContentForm() {

    const allowedAccess = localStorage.getItem('persona') === 'Admin';
    if (allowedAccess) {
        return (
        <>
            <Header />

            <form>
                <h1>Manage Content Form</h1>
                <br/>
                <hr />
                <br />
                <label htmlFor="docName"> Name of Hyperlink or Document:</label>
                <input type="text" id="docName"/>
                <br/><br/>
                <label htmlFor="url">URL Link:</label>
                <input type="text" id="url"/>
                <br/><br/>
                <label htmlFor="contentOwner">Name of Content Owner:</label>
                <input type="text" id="contentOwner"/>
                <br/><br/>
                <label htmlFor="persona">Job Position: </label>
                <select name="Job Position" id="persona">
                    <option value="" disabled selected hidden>Select</option>
                    <option value="Underwriter">Underwriter</option>
                    <option value="Business Analyst">Business Analyst</option>
                </select>
                <br/><br/>
                <label htmlFor="lastModifiedDate">Last Modified Date:</label>
                <input type="date" id="lastModifiedDate" name="lastModifiedDate"/>
                <br/><br/>
                <label htmlFor="expirationDate">Expiration Date:</label>
                <input type="date" id="expirationDate" name="expirationDate"/>
                <br/><br/>
                <h3>Content Type:</h3>
                <label htmlFor="referenceContent"> Reference Content</label>
                <input type="radio" id="referenceContent" name="contentType"/>
                <label htmlFor="workflowContent"> Workflow Content</label>
                <input type="radio" id="workflowContent" name="contentType"/>
                <br/><br/>
                <label htmlFor="docStatus">Document Status:</label>
                <select name="Document Status" id="docStatus">
                    <option value="" disabled selected hidden>Select</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Internal Review">Internal Review</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Expired">Expired</option>
                    <option value="Archived">Archived</option>
                </select>
                <br/><br/>

                <button type="reset">Reset</button><button type="submit">Submit</button>
            </form>
        </>
    );
    } else {
        return <AccessDenied />;
    }
    
}