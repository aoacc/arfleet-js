import React from 'react'
import ItemList from './ItemList'

const PlacementList = ({ assignmentId, onSelect }) => {
    const placements = [
        {
            id: 'a2138c42542a57e1c413aab0949aa3e3',
            name: 'Placement 1'
        },
        {
            id: '081f4231c215d86cc92490c56fbbb59e',
            name: 'Placement 2'
        }
    ];

    return (
        <div className="placement-list">
            {/* <h2>Placements</h2> */}
            <ItemList items={placements} />
        </div>
    )
}

export default PlacementList