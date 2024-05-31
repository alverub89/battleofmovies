import React from 'react';
import PropTypes from 'prop-types';

const MovieCard = ({ title, image, description }) => {
  return (
    <div className="movie-card">
      <img src={image} alt={`${title} Poster`} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

MovieCard.propTypes = {
  title: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default MovieCard;
