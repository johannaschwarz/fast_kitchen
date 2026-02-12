import React from 'react';
import Header from './Header.jsx';

function LegalNotice() {
    return (
        <div className="main">
            <Header />
            <div className='content'>
                <h1>Impressum</h1>
                <p>Angaben gemäß § 5 TMG</p>

                <h2>Name und Anschrift</h2>
                <p>Niklas Rousset<br />
                    Firnhaberstr. 29<br />
                    86159 Augsburg<br />
                    Deutschland<br /><br />
                    E-Mail: byrousset@gmail.com<br />
                    Telefon: 0821 60841050
                </p>

                <h2>Inhaltlich verantwortlich</h2>
                <p>Johanna Schwarz<br />
                    Firnhaberstr. 29<br />
                    86159 Augsburg<br />
                    Deutschland</p>
            </div>
        </div>
    );
}

export default LegalNotice;
