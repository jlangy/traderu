import db from '../index';
import { QueryResult } from 'pg';

const getPortfoliosByUserId = (user_id: string | number) =>
	db
		.query(
			`		
      SELECT * FROM 
      (	
        WITH stocks as (
          SELECT stocks.name, stocks.symbol, portfolios_stocks.quantity, portfolio_id
          FROM stocks JOIN portfolios_stocks ON stocks.id = stock_id
        )
        SELECT portfolios.*, json_agg(stocks) as stocks 
        FROM portfolios left join stocks on portfolios.id = portfolio_id  
        WHERE
        user_id = $1
        AND deleted_at IS NULL group by portfolios.id
      ) AS a JOIN
      (	
        WITH cryptos as (
          SELECT cryptos.name, cryptos.symbol, portfolios_cryptos.quantity, portfolio_id
          FROM cryptos JOIN portfolios_cryptos ON cryptos.id = crypto_id
        )
        SELECT portfolios.id, json_agg(cryptos) as cryptos 
        FROM portfolios left join cryptos on portfolios.id = portfolio_id  
        WHERE
        user_id = $1
        AND deleted_at IS NULL group by portfolios.id
      ) AS b on a.id = b.id
      JOIN (
        WITH values as (
          SELECT portfolio_histories.value, portfolio_histories.date_time, portfolio_id
          FROM portfolio_histories
        )
        SELECT id, json_agg(values) as values 
        FROM portfolios left join values on portfolios.id = values.portfolio_id  
        WHERE
        user_id = $1
        AND deleted_at IS NULL group by portfolios.id
      ) AS c
      ON a.id = c.id
		`,
			[user_id]
		)
		.then((portfoliosObj: QueryResult) => portfoliosObj.rows)
		.catch((err: Error) => {
			throw err;
		});

export default getPortfoliosByUserId;
