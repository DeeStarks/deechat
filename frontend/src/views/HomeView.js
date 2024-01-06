import React from 'react';
import { UserContext } from '../contexts/UserContext';

export default function HomeView() {
    const userContext = React.useContext(UserContext);
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        setUser(userContext.user);
    }, [userContext.user]);

    return (
        <div className='box-center'>
            <div>
                <h1>Hello, {user}</h1>
                <p>Select a friend from the sidebar or add a new friend to start chatting!</p>
            </div>
        </div>
    )
};
