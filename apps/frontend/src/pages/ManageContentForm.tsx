import { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header"
import {useSearchParams} from "react-router-dom";
import { AccessDenied } from "../components/AccessDenied.tsx"

export function ManageContentForm() {

    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit')
    const persona = localStorage.getItem("persona")
    const username = localStorage.getItem("username")
    const [formData, setFormData] = useState({
        name: '',
        owner: persona === 'Admin' ? '' : username ?? '',
        persona: '',
        date_modified: '',
        expiration_date: '',
        content_type: '',
        status: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [employees, setEmployees] = useState<{empid: number, username: string}[]>([]);
    const formRef = useRef<HTMLFormElement>(null);


    useEffect(() => {
        if (persona === 'Admin') {
            fetch('http://localhost:3000/employees')
                .then(res => res.json())
                .then(data => setEmployees(data));
        }
    }, []);

    useEffect(() => {
        if (editId) {
            fetch(`http://localhost:3000/contentforms/${editId}`)
                .then(res => res.json())
                .then(data => setFormData({
                    name: data.name,
                    owner: data.owner,
                    persona: data.persona,
                    date_modified: data.date_modified?.split('T')[0] ?? '',
                    expiration_date: data.expiration_date?.split('T')[0] ?? '',
                    content_type: data.content_type,
                    status: data.status
                }));
        }
    }, [editId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, name, value } = e.target;
        setFormData(prev => ({ ...prev, [id || name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.owner || !formData.persona ||
            !formData.date_modified || !formData.expiration_date ||
            !formData.content_type || !formData.status) {
            alert('Please fill in all fields before submitting.');
            return;
        }

        if (editId) {
            await fetch(`http://localhost:3000/contentforms/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            if (!file) {
                alert('Please upload a file.');
                return;
            }
            const formPayload = new FormData();
            formPayload.append('filename', formData.name);
            formPayload.append('ownerUsername', formData.owner);
            formPayload.append('date_modified', formData.date_modified);
            formPayload.append('expiration_date', formData.expiration_date);
            formPayload.append('content_type', formData.content_type);
            formPayload.append('status', formData.status);
            formPayload.append('file', file);

            await fetch('http://localhost:3000/contentforms', {
                method: 'POST',
                body: formPayload
            });
        }
        setFormData({
            name: '',
            owner: persona === 'Admin' ? '' : username ?? '',
            persona: '',
            date_modified: '',
            expiration_date: '',
            content_type: '',
            status: ''
        });
        setFile(null);
        formRef.current?.reset();
    };

    const allowedAccess = persona === 'Admin'
        || persona === 'Underwriter' || persona === 'Business Analyst';
    if (allowedAccess) {
        return (
            <>
                <Header />
                <form ref={formRef} className="content-management" onSubmit={handleSubmit}>
                    <h1>Manage Content Form</h1>
                    <br/>
                    <hr />
                    <br />
                    <label htmlFor="name">Name of Hyperlink or Document:</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} />
                    <br/><br/>
                    <label htmlFor="file">Upload File:</label>
                    <input type="file" id="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    <br/><br/>
                    <label htmlFor="owner">Name of Content Owner:</label>
                    {persona === 'Admin' ? (
                        <select id="owner" value={formData.owner} onChange={handleChange}>
                            <option value="" disabled hidden>Select</option>
                            {employees.map(emp => (
                                <option key={emp.empid} value={emp.username}>{emp.username}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" id="owner" value={formData.owner} readOnly />
                    )}
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
                    <button type="button" onClick={() => {
                        setFormData({ name: '', owner: persona === 'Admin' ? '' : username ?? '', persona: '', date_modified: '', expiration_date: '', content_type: '', status: '' });
                        setFile(null);
                        formRef.current?.reset();
                    }}>Reset</button>
                    <button type="submit">Submit</button>
                </form>
            </>
        );
    } else {
        return <AccessDenied />;
    }
}
