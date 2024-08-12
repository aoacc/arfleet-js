import React from 'react'
import './Sidebar.css'

const Sidebar = () => {
    return (
        <aside>
            <nav className="sidebar-nav">
                <ul>
                    <li><a href="/"><i className="fas fa-tachometer-alt"></i>Dashboard</a></li>
                    <li><a href="/assignments"><i className="fas fa-tasks"></i>Assignments</a></li>
                    <li><a href="/providers"><i className="fas fa-server"></i>Providers</a></li>
                    <li><a href="/settings"><i className="fas fa-cog"></i>Settings</a></li>
                </ul>
            </nav>
        </aside>
    )
}

export default Sidebar