## Mantenimiento adaptativo: fechas para integraciones internacionales

Requisito adoptado para el taller: toda fecha nueva generada por la API usa
ISO 8601 en UTC, independientemente de la zona horaria o idioma del servidor.
Ejemplo: `2026-11-26T01:30:00.000Z`.

Antes se utilizaba `toLocaleString()`, cuyo resultado depende del entorno y no
incluye una zona horaria explicita. Ahora se utiliza `toISOString()` en el registro
de las cuatro acciones y en `GET /health`.

Se conservan las cuatro tablas y los campos `recorded_at`, `timestamp`, `createdAt`
y `event_date`. Los endpoints de historial y filtros devuelven las fechas tal como
estan almacenadas, por lo que los eventos nuevos persistidos exponen el formato UTC.
El cuerpo de `POST /events` y sus respuestas mantienen su estructura.

Los registros historicos no se convierten automaticamente: sus fechas locales no
indican la zona ni el formato regional original. Migrarlos requiere conocer esos
datos para evitar asignarles una hora incorrecta. Los clientes deben admitir el
formato historico durante la transicion y pueden mostrar los nuevos valores UTC
en su zona local.

Este cambio se clasifica como adaptativo porque responde a una nueva regla de
interoperabilidad entre sistemas de distintas zonas horarias. El requisito es una
propuesta para el taller; debe contrastarse con cualquier regla especifica que
defina el docente.

El fallo de persistencia de `DELETE` sigue pendiente del mantenimiento correctivo:
su objeto se construye con fecha UTC, pero el codigo base no lo guarda.

Validacion: `npm test -- --runInBand` y `npm run build`. Las pruebas fijan un
instante con desplazamiento `-05:00` y comprueban su equivalente UTC, la persistencia
en las acciones que ya guardaban eventos y la lectura desde historial y filtros.

## Mantenimiento adaptativo: integracion de CRUD web con CORS

Requisito adoptado: permitir que los CRUD web de los estudiantes consuman la API
desde puertos o dominios diferentes, configurables para cada entorno.

La variable `CORS_ORIGINS` contiene los origenes permitidos separados por comas.
Cada origen incluye protocolo, host y puerto cuando corresponda, sin rutas ni
barra final. Por ejemplo, `http://localhost:5173`.

Desde PowerShell, dentro de `epn-event-manager`:

```powershell
$env:CORS_ORIGINS = "http://localhost:4200,http://localhost:5173"
npm run start:dev
```

En un despliegue, se configura la misma variable en el entorno del servidor.
La aplicacion lee las variables del proceso; no carga archivos `.env`
automaticamente. Reiniciar la API despues de cambiar la configuracion.

Los origenes configurados reciben permiso CORS para `GET` y `POST` con
`Content-Type`. El servidor atiende las solicitudes previas `OPTIONS` que hace
el navegador antes de enviar JSON. Los origenes deben coincidir exactamente;
no se habilitan comodines. Sin `CORS_ORIGINS`, o si esta vacia, no se conceden
permisos de acceso entre origenes.

CORS controla el acceso desde el navegador y no sustituye la autenticacion.
Las llamadas desde otros servidores o herramientas sin cabecera `Origin`
siguen funcionando. Para un origen no permitido, la respuesta no incluye
`Access-Control-Allow-Origin`; el navegador aplica esa restriccion.

Este cambio es adaptativo porque permite integrar clientes alojados en nuevos
origenes sin modificar el codigo por cada CRUD o entorno.

Validacion: `npm test -- --runInBand` y `npm run build`. Las pruebas HTTP verifican
origenes permitidos y no permitidos, el preflight de JSON, el contrato de
`POST /events`, las solicitudes sin `Origin` y la configuracion vacia. Usan los
controladores reales con un servicio de eventos simulado, sin tocar SQLite.

## Mantenimiento adaptativo: ubicacion de SQLite por entorno

Requisito adoptado: ejecutar el mismo backend en entornos que asignan una carpeta
o volumen distinto para almacenar los datos, sin editar el codigo de conexion.

La variable `DATABASE_PATH` permite seleccionar el archivo SQLite al iniciar la
aplicacion. Si no esta definida, esta vacia o contiene solo espacios, se conserva
`db/events.sqlite`. Se mantienen el motor SQLite, las entidades y las cuatro tablas.

Desde PowerShell, dentro de `epn-event-manager`, este ejemplo guarda los datos
en una carpeta del usuario fuera del repositorio:

```powershell
$env:DATABASE_PATH = Join-Path $env:LOCALAPPDATA "EpnEventManager/events.sqlite"
npm run start:dev
```

En un despliegue se configura `DATABASE_PATH` con la ubicacion del volumen
persistente. Se admiten rutas absolutas y relativas; las relativas se interpretan
desde la carpeta donde se ejecuta el proceso. La ubicacion debe permitir escritura.
TypeORM crea la carpeta y el archivo si no existen. La variable puede utilizarse
junto con `CORS_ORIGINS` y `PORT`, y requiere reiniciar la API para aplicar cambios.
La aplicacion lee el entorno del proceso; no carga archivos `.env` automaticamente.

Cambiar la ruta selecciona otra base de datos: no copia ni mueve los eventos
existentes. Para volver a la ruta predeterminada en PowerShell:

```powershell
Remove-Item Env:DATABASE_PATH -ErrorAction SilentlyContinue
```

Este cambio es adaptativo porque ajusta la conexion a las condiciones de
almacenamiento del entorno de ejecucion, conservando el modelo del taller.

Validacion: `npm test -- --runInBand` y `npm run build`. Las pruebas comprueban el
valor predeterminado y levantan el modulo real de base de datos en una ruta
temporal con espacios, verificando las cuatro tablas y la recuperacion de un
evento despues de cerrar y reabrir la conexion. No utilizan la base incluida.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
