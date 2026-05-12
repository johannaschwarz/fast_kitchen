import React from 'react';
import Header from './Header.jsx';

function LegalNotice() {
    return (
        <div className="main">
            <Header />
            <div className='content'>
                <h1>Impressum</h1>

                <h2>Angaben gemäß § 5 DDG</h2>
                <p>
                    Niklas Rousset & Johanna Schwarz<br />
                    Firnhaberstr. 29<br />
                    86159 Augsburg<br />
                    Deutschland
                </p>

                <h2>Kontakt</h2>
                <p>
                    Telefon: 0821 60841050<br />
                    E-Mail: byrousset@gmail.com
                </p>
            </div>
        </div>
    );
}

export default LegalNotice;
