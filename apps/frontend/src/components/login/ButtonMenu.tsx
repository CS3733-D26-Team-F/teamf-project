import { Link } from "react-router-dom";
export function ButtonMenu() {
    
    return (
        <div className="button-menu">
            
        </div>
    );
}

function handleButtonClick() {
    let dropdown = document.querySelector('.dropdown-content') as HTMLElement;
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}