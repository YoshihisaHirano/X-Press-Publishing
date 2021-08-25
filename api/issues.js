const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = express.Router({mergeParams: true});

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (err, row) => {
    if(err) {
      next(err);
    } else if(row) {
      req.issue = row;
       next();
    } else {
      res.sendStatus(404);
    }
  })
})

issuesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE Issue.series_id = ${req.params.seriesId}`, (err, rows) => {
    if(err) next(err);
    else res.status(200).json({issues: rows});
  })
});

issuesRouter.post('/', (req, res, next) => {
  db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $no, $date, $artist, $series)', {
    $name: req.body.issue.name,
    $no: req.body.issue.issueNumber,
    $date: req.body.issue.publicationDate,
    $artist: req.body.issue.artistId,
    $series: req.params.seriesId
  }, function(err) {
    if(err) {
      next(err);
      res.sendStatus(400);
    }
    else {
      db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`, (err, row) => {
        if(err) next(err);
        else {
          res.status(201).send({issue: row});
        }
      })
    }
  })
});

issuesRouter.put('/:issueId', (req, res, next) => {
  const issueItem = req.body.issue;
  if(!issueItem.name || !issueItem.issueNumber || !issueItem.publicationDate || !issueItem.artistId) res.sendStatus(400);
  const sql = `UPDATE Issue SET name = $name, issue_number = $no, publication_date = $date, artist_id = $artist, series_id = $series WHERE id = $id`;
  const values = {
    $name: issueItem.name,
    $no: issueItem.issueNumber,
    $date: issueItem.publicationDate,
    $artist: issueItem.artistId,
    $series: req.params.seriesId,
    $id: req.params.issueId
  }
  db.run(sql, values, (err) => {
    if(err) next(err);
    else {
      db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, row) => {
        if(err) next(err);
        else res.status(200).send({issue: row});
      })
    }
  })
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, (err) => {
    if(err) next(err);
    else res.sendStatus(204);
  })
})

module.exports = issuesRouter;
