import React from 'react';
import Sidebar from '../components/Sidebar';
import { UserContext } from '../contexts/UserContext';

export default function MainLayout({ children }) {
    const userContext = React.useContext(UserContext);
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        setUser(userContext.user);
    }, [userContext.user]);

    return (
        <div id="screen">
            <Sidebar />
            <div id="body">
                {user ? (
                    <div>
                        <div id="topbar">
                            <h2>Chatting as {user}</h2>
                            <button className="btn" onClick={userContext.logout}>Logout</button>
                        </div>
                        <div id="content">
                            {children}
                        </div>
                    </div>
                ) : (
                    <div className='box-center'>
                        <form onSubmit={userContext.login}>
                            <input type="text" placeholder="Enter your name" />
                            <button className="btn">Login</button>
                        </form>
                    </div>  
                )}
            </div>
        </div>
    )
};
