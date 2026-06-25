import { useState } from 'react'
import './App.css'
function Counter(){
    const [count, setCount] = useState (0);
    const handleClick = () => {
        setCount(count+1);
};

return(
    <div className="app-container">
        <h1>Component Counter</h1>
        <p><b>bạn đã click: {count} lần</b></p>
        <button onClick={handleClick}>
            Click để tăng
        </button>
    </div>
    );
}
export default Counter;