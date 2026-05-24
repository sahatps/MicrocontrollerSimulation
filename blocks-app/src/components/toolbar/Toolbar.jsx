import './toolbar.css'

function Toolbar({
    showCode,
    verifyCode,
    compiledCode,
    isCodeView,
    toggleCodeView,
    saveWorkspace,
    openFile,
    sendToHackCable,
    catalogVisible,
    toggleCatalog,
    selectedExample,
    onExampleChange,
    exampleOptions = []
}) {

    const Circle1 = ({ type, icon, fn, alt, onlyherizon, active }) => (
        <div className={'cc-' + type + (onlyherizon ? ' verticalview' : '') + (active ? ' active' : '')} onClick={fn} title={alt}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
    );

    return (
        <div className='toolbar'>
            <div className="toolbar-content">
                <div className='toolbar-x'>
                    <img src="/FarmBlock.png" alt="" />
                    <select
                        className="toolbar-example-select"
                        value={selectedExample}
                        onChange={(event) => onExampleChange && onExampleChange(event.target.value)}
                        title="Load block test example"
                    >
                        {exampleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <Circle1 type={1} icon='library_books' fn={() => { }} alt='Manual' onlyherizon={true} />
                    <Circle1 type={1} icon='files' fn={openFile} alt='Open file' onlyherizon={true} />
                    <Circle1 type={1} icon='save' fn={saveWorkspace} alt='Save' onlyherizon={true} />
                    <Circle1 type={1} icon='grid_view' fn={toggleCatalog} alt='Toggle components' onlyherizon={true} active={catalogVisible} />
                </div>

                <div className='toolbar-x'>
                    <Circle1
                        type={2}
                        icon={isCodeView ? 'code' : 'code_off'}
                        fn={toggleCodeView}
                        alt='Toggle code view'
                        onlyherizon={false}
                        active={isCodeView}
                    />
                    <Circle1 type={2} icon='upload_2' fn={showCode} alt='Upload' onlyherizon={true}/>
                    <Circle1 type={2} icon='verified' fn={verifyCode} alt='Verify code' onlyherizon={true}/>
                    <Circle1 type={2} icon='build' fn={compiledCode} alt='Compile code' onlyherizon={true}/>
                    <Circle1 type={2} icon='send' fn={sendToHackCable} alt='Send to HackCable' onlyherizon={true}/>
                    <div className="line-vertical verticalview"></div>
                    <div className="version verticalview">v2.0.0</div>
                </div>
            </div>
        </div>
    );
}

export default Toolbar;
