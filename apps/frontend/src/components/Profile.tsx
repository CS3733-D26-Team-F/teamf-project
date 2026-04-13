
export function Profile() {
    return (
        <div className="profile-link" aria-label="Signed in user">
            <img src="https://via.placeholder.com/40" alt="Profile" />
            <span>{localStorage.getItem('username') || 'Guest'}</span>
        </div>
    );
}