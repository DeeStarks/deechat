import React from 'react';
import { UserContext } from '../contexts/UserContext';
import { ChatContext } from '../contexts/ChatContext';
import { useParams } from 'react-router-dom';

export default function ChatView() {
    const params = useParams();

    const userContext = React.useContext(UserContext);
    const chatContext = React.useContext(ChatContext);

    const [chat, setChat] = React.useState({ messages: [] });

    React.useEffect(() => {
        chatContext.setCurrentChat(params.receiver);
        chatContext.markAsRead(params.receiver);
    }, [params.receiver]);

    React.useEffect(() => {
        setChat(chatContext.get(params.receiver));
    }, [chatContext.chats, params.receiver, chatContext]);

    const submit = (e) => {
        e.preventDefault();
        const input = e.target.querySelector("input");
        const value = input.value;
        input.value = "";
        if (value) {
            chatContext.sendMessage(userContext.user, params.receiver, value);
        }
    };

    const timeSince = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();

        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) {
            return "Just now";
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minutes ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hours ago`;
        }

        const days = Math.floor(hours / 24);
        if (days < 30) {
            return `${days} days ago`;
        }

        const months = Math.floor(days / 30);
        if (months < 12) {
            return `${months} months ago`;
        }

        const years = Math.floor(months / 12);
        return `${years} years ago`;
    };

    // update time every second
    setInterval(() => {
        var timeElements = document.getElementsByClassName("message-time");
        for (var i = 0; i < timeElements.length; i++) {
            var time = timeElements[i].getAttribute("data-time");
            timeElements[i].innerText = timeSince(new Date(time));
        }
    }, 1000);

    return (
        <div id="chat">
            <div id="chat-content">
                <ul>
                    {chat.messages.map((message, index) => (
                        <li key={index} className={message.sender === userContext.user ? "right" : "left"} id={message.id}>
                            <div className="message">
                                <div className="message-header">
                                    <span className="message-sender">{message.sender}</span>
                                    <span className="message-time" data-time={message.timestamp}>{timeSince(new Date(message.time))}</span>
                                </div>
                                <div className="line-through" />
                                <div className="message-body">
                                    {message.message}
                                </div>
                                {message.id === chat.lastRead && message.sender === userContext.user && (
                                    <div>
                                        <br />
                                        <div className="read">Read</div>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div id="chat-input">
                <form onSubmit={submit}>
                    <input type="text" placeholder="Type and hit enter to send message" />
                </form>
            </div>
        </div>
    )
};
