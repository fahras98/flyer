import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const initialFlyerData = {
    header: {
        subtitle: "FORMATION CERTIFIANTE POUR PRATICIENS DE L'ACCOMPAGNEMENT EN :",
        titleLine1: "Ennéagramme",
        titleLine2: "Évolutif",
        date: "29-30 Janvier & 01 Février 2026",
        location: "Improvway – Casablanca",
        mainImage: "images/Casablanca.png"
    },
    about: {
        title: "Le cycle complet pour maîtriser un outil puissant.",
        description: "Rejoignez-nous pour une formation immersive et certifiante. Découvrez les fondements de l'Ennéagramme Évolutif, transformez votre vision et décuplez l'impact de vos accompagnements.",
        benefits: [
            "Accès aux eLearnings complets",
            "Séminaires pratiques en groupe",
            "Expérience personnelle transformatrice",
            "Certification reconnue"
        ]
    },
    gallery: {
        image1: "/images/interagir.jpg",
        image2: "/images/dynamique.jpg",
        image3: "/images/Se-connaitre.jpg",
    },
    trainers: {
        title: "Vos enseignements en Ennéagramme Évolutif",
        list: [
            { id: 1, name: "J. Philippe VIDAL", title: "Expert Formateur", image: "images/Jean.png" },
            { id: 2, name: "Christelle ZAMARON", title: "Experte Formatrice", image: "images/christelle.png" },
            { id: 3, name: "Hassan AYADI", title: "Expert Formateur", image: "images/Hassan-AYADI.png" }
        ]
    },
    footer: {
        title: "Prêt(e) à Transformer Votre Pratique ?",
        subtitle: "Contactez-nous pour réserver votre place et commencer votre voyage.",
        whatsapp: "06 61 30 59 68",
        email: "hassan.ayadi.pac@gmail.com"
    }
};

const EditableText = ({ value, onChange, elementType = 'p', className = '' }) => {
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (elementRef.current && elementRef.current.innerText !== value) {
            elementRef.current.innerText = value;
        }
    }, [value]);

    const handleBlur = () => {
        if (elementRef.current && value !== elementRef.current.innerText) {
            onChange(elementRef.current.innerText);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && elementType !== 'textarea') {
            e.preventDefault();
            (e.target as HTMLElement).blur();
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const Tag = elementType as React.ElementType;

    return (
        <Tag
            ref={elementRef}
            className={`editable-component ${className}`}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
        />
    );
};

const EditableImage = ({ src, alt, onChange, className = '' }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setImageSrc(src);
    }, [src]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newSrc = reader.result as string;
                setImageSrc(newSrc);
                onChange(newSrc);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`editable-component editable-image-wrapper ${className}`} onClick={() => fileInputRef.current?.click()}>
            <img src={imageSrc} alt={alt} className={className} />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
                accept="image/*"
            />
        </div>
    );
};

const ControlPanel = ({ onSave, onLoad, onExport, onReset, isExporting }) => {
    const loadInputRef = useRef(null);

    const handleLoadClick = () => {
        loadInputRef.current?.click();
    };

    return (
        <div className="control-panel">
            <button onClick={onSave} disabled={isExporting}>Sauvegarder Projet</button>
            <button onClick={handleLoadClick} disabled={isExporting}>Charger Projet</button>
            <input type="file" ref={loadInputRef} style={{ display: 'none' }} onChange={onLoad} accept=".json" />
            <button onClick={() => onExport('pdf')} disabled={isExporting}>
                {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
            </button>
            <button onClick={() => onExport('png')} disabled={isExporting}>
                 {isExporting ? 'Export en cours...' : 'Exporter en PNG'}
            </button>
            <button onClick={onReset} className="reset-btn" disabled={isExporting}>Réinitialiser</button>
        </div>
    );
};

const BackgroundShape = () => (
    <svg
        className="background-shape-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
    >
        <polygon points="0,0 100,0 100,45 0,65" />
    </svg>
);

const App = () => {
    const [flyerData, setFlyerData] = useState(() => {
        try {
            const savedData = localStorage.getItem('flyerData');
            return savedData ? JSON.parse(savedData) : initialFlyerData;
        } catch (error) {
            console.error("Could not parse saved flyer data:", error);
            return initialFlyerData;
        }
    });
    const [isExporting, setIsExporting] = useState(false);
    const flyerRef = useRef(null);
    
    useEffect(() => {
        localStorage.setItem('flyerData', JSON.stringify(flyerData));
    }, [flyerData]);

    const handleDataChange = (path, value) => {
        setFlyerData(prevData => {
            const keys = path.split('.');
            let current = JSON.parse(JSON.stringify(prevData)); // Deep copy
            let final = current;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return final;
        });
    };

    const handleSave = () => {
        const dataStr = JSON.stringify(flyerData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flyer-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoad = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const loadedData = JSON.parse(event.target.result as string);
                    setFlyerData(loadedData);
                } catch (error) {
                    console.error("Error loading or parsing file:", error);
                    alert("Le fichier de sauvegarde est invalide ou corrompu.");
                }
            };
            reader.readAsText(file);
        }
        e.target.value = null; // Reset input for same-file loading
    };
    
    const handleReset = () => {
        if(window.confirm("Êtes-vous sûr de vouloir réinitialiser le flyer ? Toutes les modifications non sauvegardées seront perdues.")) {
            setFlyerData(initialFlyerData);
            localStorage.removeItem('flyerData');
        }
    };

    const handleExport = async (format) => {
        if (!flyerRef.current) return;
        setIsExporting(true);

        const controlPanel = document.querySelector('.control-panel') as HTMLElement;
        if (controlPanel) controlPanel.style.display = 'none';
        
        flyerRef.current.classList.add('is-exporting');

        try {
            const canvas = await html2canvas(flyerRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
            });
            
            if (format === 'png') {
                const imgData = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = imgData;
                a.download = 'flyer-export.png';
                a.click();
            } else if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/jpeg', 0.95); // JPEG for smaller PDF size
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('flyer-export.pdf');
            }
        } catch (error) {
            console.error("Error during export:", error);
            alert("Une erreur est survenue pendant l'exportation.");
        } finally {
             if (controlPanel) controlPanel.style.display = 'flex';
             flyerRef.current.classList.remove('is-exporting');
             setIsExporting(false);
        }
    };
    
    return (
        <>
            <main className="a4-page" ref={flyerRef}>
                <BackgroundShape />
                <header className="flyer-header">
                    <div className="header-logo-container">
                        <img src="images/lg_improvway.png" alt="Logo Improvway" className="header-logo"></img>
                        <img src="images/lg_serpent.png" alt="Logo Serpent" className="header-logo"></img>
                    </div>

                    <div className="header-main">
                        <div className="enneagram-symbol">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" />
                                <path d="M 50 2 L 91.6 66.5 L 8.4 66.5 Z" />
                                <path d="M 83.14 19.3 L 50 98 L 91.6 33.5 L 16.86 80.7 L 8.4 33.5 L 83.14 80.7 Z" />
                            </svg>
                        </div>
                         <EditableText value={flyerData.header.subtitle} onChange={v => handleDataChange('header.subtitle', v)} elementType="p" className="subtitle" />
                        <h1>
                            <EditableText value={flyerData.header.titleLine1} onChange={v => handleDataChange('header.titleLine1', v)} elementType="span" />
                            <br/>
                            <EditableText value={flyerData.header.titleLine2} onChange={v => handleDataChange('header.titleLine2', v)} elementType="span" />
                        </h1>
                        <div className="event-details">
                            <div className="detail-item">
                                <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                <EditableText value={flyerData.header.date} onChange={v => handleDataChange('header.date', v)} elementType="span" className="text" />
                            </div>
                            <div className="detail-item">
                                <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                 <EditableText value={flyerData.header.location} onChange={v => handleDataChange('header.location', v)} elementType="span" className="text" />
                            </div>
                        </div>
                    </div>
                    <div className="about-image-container">
                        <EditableImage src={flyerData.header.mainImage} alt="Interaction positive pendant la formation" onChange={v => handleDataChange('header.mainImage', v)} className="gallery-photo" />
                    </div>
                </header>
                
                <div className="flyer-content">
                    <section className="about-section">
                        <div className="about-content">
                            <EditableText value={flyerData.about.title} onChange={v => handleDataChange('about.title', v)} elementType="h2" />
                            <EditableText value={flyerData.about.description} onChange={v => handleDataChange('about.description', v)} elementType="p" />
                            <ul className="benefits-list">
                                {flyerData.about.benefits.map((benefit, index) => (
                                    <li key={index}>
                                         <EditableText value={benefit} onChange={v => handleDataChange(`about.benefits.${index}`, v)} elementType="span" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    <section className="gallery-section">
                        <div className="image-collage">
                             <EditableImage src={flyerData.gallery.image1} alt="Découverte de soi" onChange={v => handleDataChange('gallery.image1', v)} className="collage-img" />
                             <EditableImage src={flyerData.gallery.image2} alt="Parcours de développement" onChange={v => handleDataChange('gallery.image2', v)} className="collage-img" />
                             <EditableImage src={flyerData.gallery.image3} alt="Nouvelles opportunités" onChange={v => handleDataChange('gallery.image3', v)} className="collage-img" />
                        </div>
                    </section>
                    <section className="event-reminder-section">
                        <div className="reminder-item">
                            <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                            <EditableText value={flyerData.header.date} onChange={v => handleDataChange('header.date', v)} elementType="span" className="text" />
                        </div>
                        <div className="reminder-separator"></div>
                        <div className="reminder-item">
                            <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <EditableText value={flyerData.header.location} onChange={v => handleDataChange('header.location', v)} elementType="span" className="text" />
                        </div>
                    </section>
                    <section className="trainers-section">
                        <EditableText value={flyerData.trainers.title} onChange={v => handleDataChange('trainers.title', v)} elementType="h3" />
                        <div className="trainer-grid">
                            {flyerData.trainers.list.map((trainer, index) => (
                            <div className="trainer-card" key={trainer.id}>
                                <div className="trainer-photo-wrapper">
                                     <EditableImage src={trainer.image} alt={`Photo de ${trainer.name}`} onChange={v => handleDataChange(`trainers.list.${index}.image`, v)} />
                                </div>
                                <div className="trainer-info">
                                     <EditableText value={trainer.name} onChange={v => handleDataChange(`trainers.list.${index}.name`, v)} elementType="p" className="trainer-name" />
                                     <EditableText value={trainer.title} onChange={v => handleDataChange(`trainers.list.${index}.title`, v)} elementType="p" className="trainer-title" />
                                </div>
                            </div>
                            ))}
                        </div>
                    </section>
                </div>

                <footer className="flyer-footer">
                    <div className="footer-content">
                        <div className="footer-text">
                            <EditableText value={flyerData.footer.title} onChange={v => handleDataChange('footer.title', v)} elementType="h4" />
                            <EditableText value={flyerData.footer.subtitle} onChange={v => handleDataChange('footer.subtitle', v)} elementType="p" />
                        </div>
                        <div className="footer-contacts">
                            <div className="cta-card">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.006 4.994c-2.71-2.71-6.336-4.22-10.13-4.22C3.864.774 0 4.63 0 9.642c0 1.77.493 3.48 1.418 4.957L0 23.22l8.802-1.39c1.4.823 2.99 1.25 4.676 1.25h.004c5.012 0 8.87-3.855 8.87-8.868 0-3.794-1.51-7.42-4.22-10.13zm-7.13 14.71c-1.543 0-3.03-.483-4.28-1.388l-.304-.18-3.172.5.51-3.09-.2-.317c-.99-1.52-1.51-3.3-1.51-5.15C2.92 6.002 6.91 2.016 11.875 2.016c2.41 0 4.68 1.03 6.3 2.65s2.65 3.89 2.65 6.3c0 4.96-3.99 8.95-8.95 8.95z M15.31 13.25c-.27-.135-1.61-.79-1.85-.88-.25-.09-.43-.135-.61.135-.18.27-.7.88-.86 1.06-.16.18-.32.19-.59.06s-1.17-.43-2.22-1.37c-.82-.72-1.37-1.62-1.53-1.89-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.42.14-.12.18-.2.27-.34.09-.14.04-.27-.02-.4l-.6-1.44c-.24-.58-.48-.63-.66-.63h-.47c-.18 0-.48.07-.73.32-.25.25-.97.95-.97 2.32s1 2.69 1.13 2.87c.13.18 1.95 3 4.73 4.1.6.25 1.08.4 1.45.52.6.19 1.14.16 1.57.1.48-.07 1.61-.65 1.83-1.28.23-.62.23-1.15.16-1.28-.07-.14-.24-.22-.5-.35z"></path></svg>
                                </div>
                                <div className="card-info">
                                    <p className="card-label">Par WhatsApp</p>
                                    <EditableText value={flyerData.footer.whatsapp} onChange={v => handleDataChange('footer.whatsapp', v)} elementType="p" className="card-value" />
                                </div>
                            </div>
                            <div className="cta-card">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                </div>
                                <div className="card-info">
                                    <p className="card-label">Par Email</p>
                                    <EditableText value={flyerData.footer.email} onChange={v => handleDataChange('footer.email', v)} elementType="p" className="card-value" />
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
            <ControlPanel 
                onSave={handleSave} 
                onLoad={handleLoad}
                onExport={handleExport}
                onReset={handleReset}
                isExporting={isExporting}
            />
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);