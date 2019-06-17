import React from 'react'
import PropTypes from 'prop-types'
import Moment from 'react-moment'

const ProfileEducation = ({
    education: {
        school,
        degree,
        field,
        current,
        to,
        from,
        description
    }
}) => {
    return (
        <div>
            <h3 className="text-dark">{school}
            </h3>
            <p>
                <Moment format='YYYY/MM/DD'>{from}</Moment>
                - {!to
                    ? ' Now'
                    : <Moment format="YYYY/MM/DD">{to}</Moment>}
            </p>
            <p> <strong> Degree: </strong> {degree}</p>
            <p> <strong> Field: </strong> {field}</p>
            <p><strong>description: </strong></p> {description}
        </div>
    )
}

ProfileEducation.propTypes = {
    education: PropTypes.array.isRequired
}

export default ProfileEducation
