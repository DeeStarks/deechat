import React from 'react';
import { Link, useParams } from "react-router-dom";
import { UserContext } from '../contexts/UserContext';
import { ChatContext } from '../contexts/ChatContext';

export default function Sidebar() {
    const params = useParams();

    const userContext = React.useContext(UserContext);
    const chatContext = React.useContext(ChatContext);

    const add = (e) => {
        e.preventDefault();
        if (!userContext.user) {
            alert("Please login first");
            return;
        }

        const newChat = e.target[0].value;
        e.target[0].value = "";
        if (newChat) {
            chatContext.add(userContext.user, newChat);
        }
    };

    return (
        <div id="sidebar">
            <div className="sidebar-header">
                <form onSubmit={add}>
                    <input type="text" placeholder="Type and hit enter to add friend" />
                </form>
            </div>
            <div className="sidebar-body">
                <ul>
                    {Object.keys(chatContext.chats).map((chat, index) => (
                        <li key={index} className={params.receiver === chat ? "active" : ""}>
                            <Link to={`/chat/${chat}`}>{chat}</Link>
                            <div className={`notif ${chatContext.get(chat).hasUnread ? "true" : "false"}`} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
};
