import { Header } from "../components/Header"

export function ManageContentForm() {
    return (
        <>
            <Header />
            <form>
                <label htmlFor="docName"> Name of Hyperlink or Document:</label>
                <input type="text" id="docName"/>
                <br/><br/>
                <label htmlFor="url">URL Link:</label>
                <input type="text" id="url"/>
                <br/><br/>
                <label htmlFor="contentOwner">Content Owner:</label>
                <input type="text" id="contentOwner"/>
                <br/><br/>
                <label htmlFor="persona">Job Position:</label>
                <input type="text" id="persona"/>
                <br/><br/>
                <label htmlFor="lastModifiedDate">Last Modified Date:</label>
                <input type="date" id="lastModifiedDate" name="lastModifiedDate"/>
                <br/><br/>
                <label htmlFor="expirationDate">Expiration Date:</label>
                <input type="date" id="expirationDate" name="expirationDate"/>
                <br/><br/>
                Content Type:
                <br/>
                <label htmlFor="referenceContent"> Reference Content</label>
                <input type="radio" id="referenceContent" name="contentType"/>
                <label htmlFor="workflowContent"> Workflow Content</label>
                <input type="radio" id="workflowContent" name="contentType"/>
                <br/><br/>
                Document Status:
                <br/><br/>
                <input type="submit" value="Submit Form"/>
            </form>
        </>
    );
}