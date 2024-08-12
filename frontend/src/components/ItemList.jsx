import React, { useState } from 'react'

import './ItemList.css'

const ItemList = ({ items }) => {
    const [activeItemId, setActiveItemId] = useState(null);

    const handleItemClick = (itemId) => {
        setActiveItemId(itemId);
    };

    return (
        <div className="item-list">
            <ul className="list-group">
                {items.map((item) => (
                    <li 
                        className={`list-group-item list-group-item-sm ${item.id === activeItemId ? 'active' : ''}`} 
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="row">
                            <div className="col-md-8">{item.id}</div>
                            <div className="col-md-4">{item.name}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ItemList