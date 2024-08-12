import React from 'react'
import ItemList from './ItemList'

const AssignmentList = ({ onSelect }) => {
    const assignments = [
        {
            id: 'a2138c42542a57e1c413aab0949aa3e3',
            name: 'Assignment 1'
        },
        {
            id: '081f4231c215d86cc92490c56fbbb59e',
            name: 'Assignment 2'
        },
        {
            id: '1bfd09afae8b4b7fde31ac5e6005342e',
            name: 'Assignment 3'
        },
        {
            id: 'b1946ac92492d2347c6235b4d2611184',
            name: 'Assignment 4'
        },
        {
            id: '591785b794601e212b260e25925636fd',
            name: 'Assignment 5'
        }
    ]

    return (
        <div className="assignment-list">
            {/* <h4>Assignments</h4> */}
            {/* List assignments here */}
            <ItemList items={assignments} />
        </div>
    )
}

export default AssignmentList