import React, { useState } from 'react'
import AssignmentList from './AssignmentList'
import PlacementList from './PlacementList'
import FileExplorer from './FileExplorer'
import './Content.css'

const Content = () => {
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [selectedPlacement, setSelectedPlacement] = useState(1)

    return (
        <main className="content">
            <div className="content-top">
                <div className="content-top-left">
                    <AssignmentList onSelect={setSelectedAssignment} />
                </div>
                <div className="content-top-right">
                    <PlacementList assignmentId={selectedAssignment} onSelect={setSelectedPlacement} />
                </div>
            </div>
            <div className="content-bottom">
                <FileExplorer placementId={selectedPlacement} />
            </div>
        </main>
    )
}

export default Content