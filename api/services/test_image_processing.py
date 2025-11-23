import pytest
from unittest.mock import AsyncMock, patch
from api.services.image_processing import generate_image_tags, llm # Import llm directly
from langchain_core.messages import HumanMessage
from langchain_core.outputs import AIMessage

# Mock the _convert_image_to_base64 to avoid file operations
@patch('api.services.image_processing._convert_image_to_base64', return_value='base64_encoded_image_string')
@pytest.mark.asyncio
async def test_generate_image_tags_success(mock_convert_image_to_base64):
    # Mock the llm.ainvoke method
    mock_llm_ainvoke = AsyncMock(return_value=AIMessage(content='beach, sunset, person, ocean, warm colors'))
    llm.ainvoke = mock_llm_ainvoke

    filepath = "test_image.jpg"
    tags = await generate_image_tags(filepath)

    expected_tags = ['beach', 'sunset', 'person', 'ocean', 'warm colors']
    assert tags == expected_tags
    
    # Verify _convert_image_to_base64 was called
    mock_convert_image_to_base64.assert_called_once_with(filepath)

    # Verify llm.ainvoke was called with the correct HumanMessage
    mock_llm_ainvoke.assert_called_once()
    called_args, _ = mock_llm_ainvoke.call_args
    assert isinstance(called_args[0][0], HumanMessage)
    assert called_args[0][0].content[0]['type'] == 'text'
    assert 'Describe this image' in called_args[0][0].content[0]['text']
    assert called_args[0][0].content[1]['type'] == 'image_url'
    assert called_args[0][0].content[1]['image_url']['url'] == 'data:image/jpeg;base64,base64_encoded_image_string'

@patch('api.services.image_processing._convert_image_to_base64', return_value='base64_encoded_image_string')
@pytest.mark.asyncio
async def test_generate_image_tags_empty_response(mock_convert_image_to_base64):
    # Mock the llm.ainvoke method to return an empty string
    mock_llm_ainvoke = AsyncMock(return_value=AIMessage(content=''))
    llm.ainvoke = mock_llm_ainvoke

    filepath = "test_image.png"
    tags = await generate_image_tags(filepath)

    assert tags == []
    mock_convert_image_to_base64.assert_called_once_with(filepath)
    mock_llm_ainvoke.assert_called_once()

@patch('api.services.image_processing._convert_image_to_base64', return_value='base64_encoded_image_string')
@pytest.mark.asyncio
async def test_generate_image_tags_exception_handling(mock_convert_image_to_base64):
    # Mock the llm.ainvoke method to raise an exception
    mock_llm_ainvoke = AsyncMock(side_effect=Exception("API Error"))
    llm.ainvoke = mock_llm_ainvoke

    filepath = "error_image.jpg"
    tags = await generate_image_tags(filepath)

    assert tags == []
    mock_convert_image_to_base64.assert_called_once_with(filepath)
    mock_llm_ainvoke.assert_called_once()
