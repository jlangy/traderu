/** Express server app file
 * @module app
 * @requires express
 * @requires dotenv
 * @requires helmet
 * @requires connect-history-api-fallback
 * @requires app/routes/api/authenticate
 * @requires app/routes/api/cryptos
 * @requires app/routes/api/leaderboard
 * @requires app/routes/api/login
 * @requires app/routes/api/portfolios
 * @requires app/routes/api/register
 * @requires app/routes/api/stocks
 */

require('dotenv').config();
import express, { Express, Request, Response } from 'express';
import * as helmet from 'helmet';
import * as hist from 'connect-history-api-fallback';
const cors = require('cors');
const app: Express = express();

// Local vs deployed config
const ENV = process.env.BUILD_ENV || 'production';
console.log('Running environment:', ENV);

// Initialize middleware
app.use(cors());
app.options('*', cors());
app.use(helmet.default());
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api/register', require('./routes/register'));
app.use('/api/login', require('./routes/login'));
app.use('/api/authenticate', require('./routes/authenticate'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/cryptos', require('./routes/cryptos'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/portfolios', require('./routes/portfolios'));

// Initialize client route middleware
app.use(hist.default());
app.use(express.static('./server/static'));

// Client routes

/**
 * Route serving base application
 * @name get/
 * @function
 * @param {String} path Express path
 * @param {Function} middleware Callback function used as middleware
 */
app.get('/', (_: Request, res: Response) => {
	res.render('./server/static/index.html');
});

/**
 * Catch route to deal with unhandled GETs
 * @name get/*
 * @function
 * @param {String} path Express path
 * @param {Function} middleware Callback function used as middleware
 */
app.get('/*', (_: Request, res: Response) => {
	res.redirect('/');
});

export default app;
