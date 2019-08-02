# Golang proposal

This is the project structure proposed to be used by microservices using this language. It should be enough to start a new project with minimun configuration.

- [Requirements](#requirements)
- [Naming Convention](#naming-convention)
- [General Guidelines](#general-guidelines)
- [Install](#install)
- [Getting started](#getting-started)
- [Creating a service file](#creating-a-service-file)
- [Creating a handler](#creating-a-handler)
- [Adding an endpoint](#adding-an-endpoint)

## Requirements
`go` version 
1.12.1 darwin/amd64 or higher.

Packages
github.com/gorilla/mux
github.com/go-sql-driver/mysql
gopkg.in/yaml.v2

## Naming Convention
- Use descriptive names, avoid ambiguos names.
- Use lower case for package names.
- Use snake_case for long file names.
- Use [name]_handler.go for handlers.
- Use [name]_service.go for services.

## General Guidelines
- Try to avoid using json.Marshall, instead use handlers.jsonConverter when possible.
- Put all custom errors for handlers inside handler.go and services errors in service.go.
- When using `httpRequest` struct, always `defer Response.Body.Close()`.

## Install
- You can donwload this project and change basic info to start using it (see getting started section).
- Download the *service-generator cli* to create a new project using the command `service-generator new -n name_of_project -m module_url`.

## Getting started
First of all you need to replace the module (sanservices.git.beanstalkapp.com/goproposal.git) in all the imports and the `go.mod` to match your project’s module.

To be able to connect to your database and set app's port number you need to change `conf.yaml` which is in the root folder with corresponding variables. Remember this file should match the Configuration struct in `settings > configuration.go` in order to work.

After that you need to change the project's base url. Go to `internal > handlers > routes.go` to change `PathPrefix` and add your endpoints.

If *Dockerfile* and *docker-compose* require modification, please refer to SRE department.

## Creating a service file
To make any interaction with the database the process should be handle by the services package. We'll create a new file `internal > services > users_service.go`:

This is a function that returns the list of users, note that it has access to the Service pointer and uses the User struct in models package.
```go
func (s *Service) GetUsers(ctx context.Context) ([]models.User, error)
```

to get a better control over queries failure we get the connection Id from the connection pool and also the connection.

```go
conn, connID, err := s.getConnFromPool(ctx)
	if err != nil {
		return nil, err
	}

defer conn.Close()
```

Then you can query the server and if an error occurs we can also kill the running query. 

```go
rows, err := conn.QueryContext(ctx, qrystring)
	if err != nil {
		s.killQuery(connID, err)
		return nil, err
	}

defer rows.Close()
```

*Note: this is required mostly for mysql databases, other like postgreSQL might not need it because it is handled by the sql package*.

After that we can process the data as needed and return the array of users.

```go
users := []models.User{}

for rows.Next() {
  user := models.User{}
  err = rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email,)
  if err != nil {
    return users, err
  }

  users = append(users, user)
}

return users, nil
```

## Creating a handler
The purpose of any handler is to process the incoming requests to the server, we'll continue with the users example bellow:

This function will return a specific user located in `internal > handlers > users_handler.go` and has access to the handler pointer.

```go
func (h *handler) login(w http.ResponseWriter, req *http.Request)
```

To decode the incoming data we will create a struct.

```go
type userInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
```

Now we can get the data from the request.

```go
uinput := &userInput{}

// use the function to decode the request available in the handler_utils
err := jsonConverter(req.Body, &uinput)

// If there is an error we use the corresponding function 
// to send the error to the client
if err != nil {
  log.Println(err)
  w.WriteHeader(http.StatusInternalServerError)
  jsonErrorResponse(w, err, nil)
  return
}
```

Now we can call the service method to validate the login, if everything is correct we return the user data to the client.

```go
ctx := req.Context()
user, err := h.Service.loginUser(ctx, uinput.Email, uinput.Password)

if err != nil{
  //...
}

jsonResponse(w, user)
```

## Adding an endpoint

After this we just need to enable this endpoint in `internal > handlers > routes.go`.

```go
// Router returns api router
func (h *handler) Router() *mux.Router {
  
  //...

  api.HandleFunc("/login", h.login).Methods("POST")

  //...

  return router
}
```
