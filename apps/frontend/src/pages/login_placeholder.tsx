import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { LinksDemo } from "../components/mainmenu/Links.tsx"

export function LoginPlaceholder() {
    return (
        <>
            <Header />
            <Hero />
            <LinksDemo />
        </>
    )
}

async function handleLogin(username: string, password: string) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (response.status === 200) {
      const data = await response.json();

      localStorage.setItem('persona', data.employee.persona);
      localStorage.setItem('username', data.employee.username);
      localStorage.setItem('empid', String(data.employee.empid));
      setSessionTo(data.employee.persona, data.employee.username, data.employee.empid);
      return;
    }
    // backend sends plain text for 400/401 right now
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  } catch (error) {
    console.error('Error:', error);
  }


}

async function setSessionTo(persona: string, username: string, empid: number) {

    localStorage.getItem('persona');
    localStorage.getItem('username');
    localStorage.getItem('empid');


    if (persona === 'Admin') {
        displayAdmin();
        console.log('Admin access');
        
    }
    if (persona === 'Underwriter'){
        console.log('Underwriter access');
    }
    if (persona === 'Business Analyst'){
        console.log('Business Analyst access');
    }
    else {
        console.log('Limit access: No persona found');
    }
}

async function displayAdmin(){
    document.getElementById('manage-content')!.style.display = ''
    document.getElementById('manage-employees')!.style.display = 'block';
    document.getElementById('business-analyst')!.style.display = 'block';
    document.getElementById('core-commercial-underwriter')!.style.display = 'block';
}

async function displayUnderwriter(){
    document.getElementById('manage-content')!.style.display = 'block';
    document.getElementById('business-analyst')!.style.display = 'block';
    document.getElementById('core-commercial-underwriter')!.style.display = 'block';
}


