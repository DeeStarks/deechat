# DEECHAT

Simple chat application using Django Channels and React.

## Installation and usage

### Using docker

1. Pull and run both frontend and backend images from docker hub
```bash
$ docker run -d --network host deestarks/deechat
$ docker run -d --network host deestarks/deechat-backend
```

2. Open http://localhost:3000 in your browser

### From source

1. Clone the repository
```bash
$ git clone git@github.com:DeeStarks/deechat.git
```

2. Install dependencies
```bash
$ cd frontend && yarn install
$ cd backend && pip install -r requirements.txt
```

3. Run the backend server
```bash
$ cd backend && python manage.py runserver 6001
```
> To use the default port 8000, you need to change the `REACT_APP_API_DOMAIN` in `frontend/.env` to `localhost:8000`

4. Run the frontend server
```bash
$ cd frontend && yarn start
```

5. Open http://localhost:3000 in your browser
