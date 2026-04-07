import { useState, useEffect } from "react";
import { Header } from "../components/Header"

export function ManageContentForm() {
    const [formData, setFormData] = useState({
        name: '', url: '', owner: '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: ''
    });
    const [employees, setEmployees] = useState<{empid: number, username: string}[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/employees')
            .then(res => res.json())
            .then(data => setEmployees(data));
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, name, value } = e.target;
        setFormData(prev => ({ ...prev, [id || name]: value}));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('http://localhost:3000/contentforms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        setFormData({ name: '', url: '', owner: '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: '' });
        (e.target as HTMLFormElement).reset();
    };
    return (
        <>
            <Header />

            <form onSubmit={handleSubmit}>
                <h1>Manage Content Form</h1>
                <br/>
                <hr />
                <br />
                <label htmlFor="name"> Name of Hyperlink or Document:</label>
                <input type="text" id="name" onChange={handleChange} />
                <br/><br/>
                <label htmlFor="url">URL Link:</label>
                <input type="text" id="url" onChange={handleChange} />
                <br/><br/>
                <label htmlFor="owner">Name of Content Owner:</label>
                <select id="owner" value={formData.owner} onChange={handleChange}>
                    <option value="" disabled hidden>Select</option>
                    {employees.map(emp => (
                        <option key={emp.empid} value={emp.username}>{emp.username}</option>
                    ))}
                </select>
                <br/><br/>
                <label htmlFor="persona">Job Position: </label>
                <select name="Job Position" id="persona" onChange={handleChange}>
                    <option value="" disabled selected hidden>Select</option>
                    <option value="Underwriter">Underwriter</option>
                    <option value="Business Analyst">Business Analyst</option>
                </select>
                <br/><br/>
                <label htmlFor="lastModifiedDate">Last Modified Date:</label>
                <input type="date" id="date_modified" name="lastModifiedDate" onChange={handleChange} />
                <br/><br/>
                <label htmlFor="expirationDate">Expiration Date:</label>
                <input type="date" id="expiration_date" name="expirationDate" onChange={handleChange} />
                <br/><br/>
                <h3>Content Type:</h3>
                <input type="radio" id="referenceContent" name="content_type" value="Reference"
                       onChange={() => setFormData({ ...formData, content_type: 'Reference'})} />
                <label htmlFor="referenceContent"> Reference Content</label>
                <input type="radio" id="workflowContent" name="content_type" value="Workflow"
                       onChange={() => setFormData({ ...formData, content_type: 'Workflow' })} />
                <label htmlFor="workflowContent"> Workflow Content</label>
                <br/><br/>
                <label htmlFor="docStatus">Document Status:</label>
                <select name="Document Status" id="status" onChange={handleChange} >
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
}