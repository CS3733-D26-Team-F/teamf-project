

export function LoginForm() {
    return (
        <form className="login-form">
            <div className="entry">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" />
            </div>

            <div className="entry">
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" />
            </div>

            <button type="submit">Log In</button>
        </form>
    );
}
