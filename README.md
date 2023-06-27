# Google Calendar StreamDeck Plugin

Because Google Auth is really hard to implement outside a browser context, this plugin uses
basic auth instead. How? Well you need some sort of networking auth adapter 
[such as this one I wrote](https://plugins.traefik.io/plugins/63cd79ab3cccb4a7200f6f54/upstream-o-auth).

Then you just need 3 config properties:
- URL to the Google Calendar API list events endpoint via your basic auth proxy.
  E.g., `https://mygoogleproxy.example.org/calendar/v3/calendars/username@gmail.com/events`
- Basic auth username
- Basic auth password
