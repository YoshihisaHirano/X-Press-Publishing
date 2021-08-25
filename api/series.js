const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const seriesRouter = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Series', (err, rows) => {
    if(err) next(err);
    else res.status(200).send({series: rows});
  })
})

seriesRouter.post('/', (req, res, next) => {
  db.run('INSERT INTO Series (name, description) VALUES ($name, $description)', {
    $name: req.body.series.name,
    $description: req.body.series.description
  }, function(err) {
    if(err) {
      next(err);
      res.sendStatus(400);
    }
    else {
      db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, row) => {
        if(err) next(err);
        else res.status(201).send({series: row});
      })
    }
  })
});

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, (err, row) => {
    if(err) {
      next(err);
    } else if(row) {
      req.series = row;
      next();
    } else res.sendStatus(404);
  })
})

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).send({series: req.series});
})

seriesRouter.put('/:seriesId', (req, res, next) => {
  if(!req.body.series.name || !req.body.series.description) res.sendStatus(400);
  const sql = 'UPDATE Series SET name = $name, description = $description WHERE Series.id = $id';
  const values = {$name: req.body.series.name, $description: req.body.series.description, $id: req.params.seriesId}
  db.run(sql, values, (err) => {
    if(err) next(err);
    else {
      db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, row) => {
        if(err) next(err);
        else {
          res.status(200).send({series: row})
        }
      })
    }
  })
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`, (err, row) => {
    if(err) next(err);
    else if(row) res.sendStatus(400);
    else {
      db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, (err) => {
        if(err) next(err);
        else res.sendStatus(204);
      })
    }
  })
});



module.exports = seriesRouter;
