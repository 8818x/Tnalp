
function Rating(props) {
    const { rating, numReviews, caption } = props;
    return (
        <div className="rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                    <i
                        className={
                            rating >= star
                                ? 'fas fa-star'
                                : rating >= star - 0.5
                                    ? 'fas fa-star-half-alt'
                                    : 'far fa-star'
                        }
                    />
                </span>
            ))}
            {caption ? (
                <span className="rating-text">{caption}</span>
            ) : (
                <span className="rating-text">
                    {rating.toFixed(1)} · {numReviews} reviews
                </span>
            )}
        </div>
    );
}

export default Rating;
