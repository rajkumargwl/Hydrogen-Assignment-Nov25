import React from 'react';


export default function OptionsComponent({product,selectedOptions,handleClick, handleAllImages, Variants,font, color}) {
    return (
        <div className={`optionss order-${Variants}`}>
            {console.log("Product Options: ", product?.options[0]?.values[0])}
                            {
                               product?.options[0]?.values[0] !='Default Title' && product?.options?.map((option) => (
                                    <div key={option.name} className="mt-2">
                                        <label style={{color: color, fontSize: font}} className="block">
                                            {option.name}
                                        </label>
                                        <select
                                            style={{color: color, fontSize: font}} 
                                            // value={
                                            //  selectedOptions[option.name]    
                                            // }
                                            onChange={(e) => { 
                                                const value = e.target.value;
                                                if (value === "") return; // ❌ ignore default click
                                                if (value === "All") {
                                                    handleAllImages();
                                                    return;
                                                }
                                                handleClick(option.name, e.target.value) 
                                            }}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >    
                                            <option value="">Select {option.name}</option>
                                            {option.name == "Color" && (
                                            <option value="All">All</option>)}
                                            
                                            {option.values.map((value) => (
                                                <option key={value} value={value}>{value}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))
                            }
                            </div>
    )
}