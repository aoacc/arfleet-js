import React, { useState, useEffect } from 'react'
import ItemList from './ItemList'
import './FileExplorer.css'

const FileExplorer = ({ placementId }) => {
    const [files, setFiles] = useState([])

    useEffect(() => {
        // Fetch files for the selected placement
        if (placementId) {
            fetchFiles(placementId)
        }
    }, [placementId])

    const fetchFiles = async (id) => {
        // Mock API call to fetch files
        // In a real implementation, this would be an actual API call
        const mockFiles = [
            { id: '1', name: 'file1.txt', type: 'file' },
            { id: '2', name: 'folder1', type: 'folder' },
            { id: '3', name: 'file2.jpg', type: 'file' },
        ]
        setFiles(mockFiles)
    }

    return (
        <div className="file-explorer">
            {placementId ? (
                <ItemList 
                    items={files} 
                    renderItem={(item) => (
                        <div className={`file-item ${item.type}`}>
                            <i className={`fas ${item.type === 'folder' ? 'fa-folder' : 'fa-file'}`}></i>
                            {item.name}
                        </div>
                    )}
                />
            ) : (
                <p>Select a placement to view files</p>
            )}
        </div>
    )
}

export default FileExplorer