import React from "react";

export const ChatContext = React.createContext();

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = React.useState({});
    const [currentChat, setCurrentChat] = React.useState(null);

    const get = (chat) => {
        if (!chats[chat]) {
            return {
                conns: {
                    msg: null,
                    ack: null, // for read acknowledgement
                },
                sender: null,
                receiver: null,
                messages: [],
                hasUnread: false,
                lastRead: null,
            };
        }
        return chats[chat];
    };

    const add = async (sender, receiver) => {
        if (!chats[receiver]) {
            // first, generate token for chat
            const token = await fetch(`http://${process.env.REACT_APP_API_DOMAIN}/api/tokens/${sender}/${receiver}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": process.env.REACT_APP_API_KEY,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.token) {
                        return data.token;
                    }
                    return null;
                })
                .catch((err) => {
                    console.log(err);
                    return null;
                });

            if (!token) {
                return;
            }

            // connect to websocket
            const msgConn = new WebSocket(`ws://${process.env.REACT_APP_API_DOMAIN}/ws/chat/${token}`);
            const ackConn = new WebSocket(`ws://${process.env.REACT_APP_API_DOMAIN}/ws/ack/${token}`);

            var newChats = { ...chats };
            newChats[receiver] = {
                conns: {
                    msg: msgConn,
                    ack: ackConn, // for read acknowledgement
                },
                sender: sender,
                receiver: receiver,
                messages: [],
                hasUnread: false,
                lastRead: null,
            };
            setChats(newChats);
        }
    };

    const markAsRead = React.useCallback((chat) => {
        if (!chats[chat]) {
            return;
        }
        
        const newChats = { ...chats };
        newChats[chat].hasUnread = false;
        setChats(newChats);

        // send read acknowledgement
        if (newChats[chat].conns.ack && newChats[chat].messages.length > 0) {
            newChats[chat].conns.ack.send(JSON.stringify({
                read_by: newChats[chat].sender,
                message_id: newChats[chat].messages[newChats[chat].messages.length - 1].id, // last message
            }));
        }
    }, [chats]);

    const newMessage = React.useCallback((sender, receiver, message) => {
        if (!chats[receiver]) {
            return;
        }

        const newChats = { ...chats };
        newChats[receiver].messages.push(message);
        if (message.sender !== sender) {
            newChats[receiver].hasUnread = true;
            
            if (message.sender === currentChat) {
                markAsRead(currentChat);
            }
        }

        setChats(newChats);
    }, [chats, currentChat, markAsRead]);

    React.useEffect(() => {
        // listen for messages and read acknowledgements
        Object.keys(chats).forEach((chat) => {
            if (chats[chat].conns.msg) {
                chats[chat].conns.msg.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    newMessage(chats[chat].sender, chat, data);
                };

                chats[chat].onclose = (e) => {
                    delete chats[chat];
                    setChats(chats);
                };
            }

            if (chats[chat].conns.ack) {
                chats[chat].conns.ack.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    // if the current user sent the message, update the last read
                    if (data.read_by !== chats[chat].sender) {
                        const newChats = { ...chats };
                        newChats[chat].lastRead = data.message_id;
                        setChats(newChats);
                    }
                };
            };
        });
    }, [chats, newMessage]);

    const sendMessage = (sender, receiver, message) => {
        if (!chats[receiver]) {
            return;
        }

        chats[receiver].conns.msg.send(JSON.stringify({
            sender: sender,
            message: message,
        }));
    };

    return (
        <ChatContext.Provider value={{ chats, get, add, sendMessage, markAsRead, setCurrentChat }}>
            {children}
        </ChatContext.Provider>
    );
}
