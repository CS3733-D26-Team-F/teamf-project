import { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header"

export function ManageContentForm() {
    const [formData, setFormData] = useState({
        name: '', url: '', owner: '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: ''
    });
    const [employees, setEmployees] = useState<{empid: number, username: string}[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        fetch('http://localhost:3000/employees')
            .then(res => res.json())
            .then(data => setEmployees(data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, name, value } = e.target;
        setFormData(prev => ({ ...prev, [id || name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.url || !formData.owner || !formData.persona ||
            !formData.date_modified || !formData.expiration_date ||
            !formData.content_type || !formData.status) {
            alert('Please fill in all fields before submitting.');
            return;
        }

        await fetch('http://localhost:3000/contentforms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        setFormData({ name: '', url: '', owner: '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: '' });
        formRef.current?.reset();
    };

    return (
        <>
            <Header />
            <form ref={formRef} onSubmit={handleSubmit}>
                <h1>Manage Content Form</h1>
                <br/>
                <hr />
                <br />
                <label htmlFor="name">Name of Hyperlink or Document:</label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} />
                <br/><br/>
                <label htmlFor="url">URL Link:</label>
                <input type="text" id="url" value={formData.url} onChange={handleChange} />
                <br/><br/>
                <label htmlFor="owner">Name of Content Owner:</label>
                <select id="owner" value={formData.owner} onChange={handleChange}>
                    <option value="" disabled hidden>Select</option>
                    {employees.map(emp => (
                        <option key={emp.empid} value={emp.username}>{emp.username}</option>
                    ))}
                </select>
                <br/><br/>
                <label htmlFor="persona">Job Position:</label>
                <select id="persona" value={formData.persona} onChange={handleChange}>
                    <option value="" disabled hidden>Select</option>
                    <option value="Underwriter">Underwriter</option>
                    <option value="Business Analyst">Business Analyst</option>
                </select>
                <br/><br/>
                <label htmlFor="date_modified">Last Modified Date:</label>
                <input type="date" id="date_modified" value={formData.date_modified} onChange={handleChange} />
                <br/><br/>
                <label htmlFor="expiration_date">Expiration Date:</label>
                <input type="date" id="expiration_date" value={formData.expiration_date} onChange={handleChange} />
                <br/><br/>
                <h3>Content Type:</h3>
                <input type="radio" name="content_type" value="Reference" onChange={handleChange}
                       checked={formData.content_type === 'Reference'} />
                <label> Reference Content</label>
                <input type="radio" name="content_type" value="Workflow" onChange={handleChange}
                       checked={formData.content_type === 'Workflow'} />
                <label> Workflow Content</label>
                <br/><br/>
                <label htmlFor="status">Document Status:</label>
                <select id="status" value={formData.status} onChange={handleChange}>
                    <option value="" disabled hidden>Select</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Internal Review">Internal Review</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Expired">Expired</option>
                    <option value="Archived">Archived</option>
                </select>
                <br/><br/>
                <button type="button" onClick={() => { setFormData({ name: '', url: '', owner: '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: '' }); formRef.current?.reset(); }}>Reset</button>
                <button type="submit">Submit</button>
            </form>
        </>
    );
}
