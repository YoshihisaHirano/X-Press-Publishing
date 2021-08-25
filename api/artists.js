const express = require('express');
const sqlite3 = require('sqlite3');

const artistRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistRouter.param('artistId', (req, res, next, artistId) => {
  db.get('SELECT * FROM Artist WHERE id = $id', { $id: artistId }, (err, row) => {
    if(err) next(err);
    else if(row) {
      req.artist = row;
      next();
    }
    else res.sendStatus(404);
  })
})

artistRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, rows) => {
    if(err) next(err);
    else {
      res.status(200).json({artists: rows})
    }
  })
});

artistRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({ artist: req.artist });
});

artistRouter.post('/', (req, res, next) => {
  const q = req.body.artist;
  if(!q.name || !q.dateOfBirth || !q.biography) res.sendStatus(400);
  const currentlyEmployed = q.isCurrentlyEmployed === 0 ? 0 : 1;
  db.run('INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $date, $bio, $employed)', {
    $name: q.name,
    $date: q.dateOfBirth,
    $bio: q.biography,
    $employed: currentlyEmployed,
  }, function(err) {
    if(err) next(err);
    else {
      db.get('SELECT * FROM Artist WHERE id = $id', {$id: this.lastID}, (err, row) => {
        if(err) next(err);
        else res.status(201).json({artist: row});
      })
    }
  });
})

artistRouter.put('/:artistId', (req, res, next) => {
  const name = req.body.artist.name,
        dateOfBirth = req.body.artist.dateOfBirth,
        biography = req.body.artist.biography,
        isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !dateOfBirth || !biography) {
    return res.sendStatus(400);
  }

    db.run('UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, ' +
        'biography = $biography, is_currently_employed = $isCurrentlyEmployed ' +
        'WHERE Artist.id = $artistId', {
          $name: name,
          $dateOfBirth: dateOfBirth,
          $biography: biography,
          $isCurrentlyEmployed: isCurrentlyEmployed,
          $artistId: req.params.artistId
    }, function(err) {
      if(err) next(err);
      else {
        db.get('SELECT * FROM Artist WHERE id = $id', {$id: req.params.artistId}, (err, row) => {
          if(err) next(err);
          else {
            res.status(200).json({artist: row});
          }
        })
      }
    })
})

artistRouter.delete('/:artistId', (req, res, next) => {
  db.run('UPDATE Artist SET is_currently_employed = 0 WHERE id = ?', [req.params.artistId], (err) => {
    if(err) next(err);
    else {
      db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (err, row) => {
        if(err) next(err);
        else res.status(200).send({artist: row});
      })
    }
  })
})




module.exports = artistRouter;
